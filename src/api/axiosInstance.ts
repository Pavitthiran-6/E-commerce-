import axios from 'axios';

// --------------------------------------------------------------------------
// Configuration
// --------------------------------------------------------------------------

// Timeout for backend requests. 60s allows Render free-tier cold starts.
const REQUEST_TIMEOUT_MS = 60000;

// Retry config: one fast retry for transient server/network errors.
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 800;

/** Returns true for errors that are worth a single retry. */
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
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

// --------------------------------------------------------------------------
// Request interceptor — attach JWT
// --------------------------------------------------------------------------
axiosInstance.interceptors.request.use(
  (config: any) => {
    try {
      const raw = localStorage.getItem('auth_user');
      if (raw) {
        const user = JSON.parse(raw);
        if (user?.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch {
      // Corrupted storage — ignore silently
    }

    if (config._retryCount === undefined) config._retryCount = 0;

    return config;
  },
  (error: any) => Promise.reject(error)
);

// --------------------------------------------------------------------------
// Response interceptor — auth handling & retries
// --------------------------------------------------------------------------
axiosInstance.interceptors.response.use(
  // ✅ Success — pass through unchanged
  (response: any) => response,

  async (error: any) => {
    // ── 401 Unauthorized → clear session and redirect to login ───────────
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_user');
      if (window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login';
      }
      return Promise.reject(error);
    }

    // ── 403 Forbidden → redirect appropriately ────────────────────────────
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

    // ── Transient errors — ONE fast retry then propagate ─────────────────
    const config = error.config;

    if (config && isRetryable(error)) {
      const retryCount = config._retryCount ?? 0;

      if (retryCount < MAX_RETRIES) {
        config._retryCount = retryCount + 1;
        await sleep(RETRY_DELAY_MS);
        try {
          return await axiosInstance(config);
        } catch (retryError) {
          // Retry also failed — propagate the error to the caller
          return Promise.reject(retryError);
        }
      }
    }

    // ── All other errors — reject and let the UI handle it ───────────────
    return Promise.reject(error);
  }
);

export default axiosInstance;
