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
  timeout: 12000,
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

    // Fast-fallback: if backend was previously detected as down, skip the
    // real HTTP request entirely and go straight to the mock handler.
    // We do this by rejecting with a special tagged error that carries the
    // original config — Axios does NOT attach .config to CancelToken errors,
    // which caused "Cannot read properties of undefined (reading 'url')".
    if (sessionStorage.getItem('belledonne_backend_unreachable') === 'true') {
      const mockError: any = new Error('Backend known to be unreachable');
      mockError.__isMockFallback = true;
      mockError.config = config; // attach config manually so we can use it below
      return Promise.reject(mockError);
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
    // ── Fast-fallback (backend previously known to be down) ──────────────
    // Handles both the new tagged error and the legacy CancelToken approach
    if (
      error?.__isMockFallback ||
      (axios.isCancel(error) && error.message === 'Backend known to be unreachable')
    ) {
      const cfg = error.config;
      if (!cfg) {
        // Config is missing — cannot construct a mock response; reject cleanly
        return Promise.reject(new Error('Mock fallback: missing request config'));
      }
      return handleMockRequest(cfg);
    }

    // ── 401 Unauthorized ────────────────────────────────────────────────
    if (error.response?.status === 401) {
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
        try {
          return await axiosInstance(config);
        } catch (retryError: any) {
          // All retries exhausted with a network error → switch to mock mode
          if (!retryError.response && (retryError._retryCount ?? 0) >= MAX_RETRIES) {
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

    // First-time network error (no config or no retries set up)
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
