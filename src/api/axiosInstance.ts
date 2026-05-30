import axios from 'axios';
import { handleMockRequest } from './mockDataHandler';

// --------------------------------------------------------------------------
// Retry / backoff helpers
// --------------------------------------------------------------------------

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [500, 1500, 3000]; // exponential-ish backoff

/** Returns true for errors that are worth retrying (network / server errors). */
function isRetryable(error: any): boolean {
  if (!error.response) return true; // network error / timeout
  const status = error.response.status;
  return status === 408 || status === 429 || status >= 500;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// --------------------------------------------------------------------------
// Axios instance
// --------------------------------------------------------------------------

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 12000, // slightly more generous timeout
  headers: { 'Content-Type': 'application/json' },
});

// --------------------------------------------------------------------------
// Request interceptor
// --------------------------------------------------------------------------
axiosInstance.interceptors.request.use(
  (config: any) => {
    // Attach JWT token if available
    try {
      const raw = localStorage.getItem('auth_user');
      if (raw) {
        const user = JSON.parse(raw);
        if (user?.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch {
      // corrupted storage — ignore silently
    }

    // Fast-fallback: if backend was previously detected as down, cancel the
    // real request and route it straight through the mock handler.
    if (sessionStorage.getItem('belledonne_backend_unreachable') === 'true') {
      config.cancelToken = new axios.CancelToken((cancel) =>
        cancel('Backend known to be unreachable')
      );
    }

    // Tag the config so the response interceptor knows the current retry count
    if (config._retryCount === undefined) config._retryCount = 0;

    return config;
  },
  (error: any) => Promise.reject(error)
);

// --------------------------------------------------------------------------
// Response interceptor
// --------------------------------------------------------------------------
axiosInstance.interceptors.response.use(
  // ✅ Success — pass through
  (response: any) => response,

  async (error: any) => {
    // ── Fast-fallback cancels ────────────────────────────────────────────
    if (
      axios.isCancel(error) &&
      error.message === 'Backend known to be unreachable'
    ) {
      return handleMockRequest(error.config);
    }

    // ── 401 Unauthorized ────────────────────────────────────────────────
    if (error.response?.status === 401) {
      // Only clear token if this is a genuine auth failure (not a mock request)
      const isMockMode =
        sessionStorage.getItem('belledonne_backend_unreachable') === 'true';
      if (!isMockMode) {
        localStorage.removeItem('auth_user');
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
      }
      return Promise.reject(error);
    }

    // ── 403 Forbidden ────────────────────────────────────────────────────
    if (error.response?.status === 403) {
      const isAdminApiCall = error.config?.url?.includes('/api/admin');
      if (isAdminApiCall) {
        localStorage.removeItem('auth_user');
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
      } else {
        window.location.href = '/';
      }
      return Promise.reject(error);
    }

    // ── Network error / server error — retry with backoff ───────────────
    const config = error.config;
    if (config && isRetryable(error)) {
      const retryCount = config._retryCount ?? 0;

      if (retryCount < MAX_RETRIES) {
        config._retryCount = retryCount + 1;
        const delay = RETRY_DELAYS_MS[retryCount] ?? 3000;
        await sleep(delay);
        // Retry via the same instance (interceptors fire again)
        try {
          return await axiosInstance(config);
        } catch (retryError: any) {
          // If ALL retries exhausted and it's still a network error:
          if (!retryError.response && retryError._retryCount >= MAX_RETRIES) {
            console.warn(
              'Backend unreachable after retries. Falling back to Frontend Mock Mode...'
            );
            sessionStorage.setItem('belledonne_backend_unreachable', 'true');
            return handleMockRequest(config);
          }
          return Promise.reject(retryError);
        }
      }

      // Exhausted retries with a network error → switch to mock mode
      if (!error.response) {
        console.warn(
          'Backend unreachable after retries. Falling back to Frontend Mock Mode...'
        );
        sessionStorage.setItem('belledonne_backend_unreachable', 'true');
        return handleMockRequest(config);
      }
    }

    // First-time network error (no retries yet for non-retryable configs)
    if (!error.response && config) {
      console.warn(
        'Backend unreachable. Falling back to Frontend Mock Mode for client demo...'
      );
      sessionStorage.setItem('belledonne_backend_unreachable', 'true');
      return handleMockRequest(config);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
