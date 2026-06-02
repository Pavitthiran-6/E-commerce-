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
// Helper: JWT Expiration Check
// --------------------------------------------------------------------------
export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payloadDecoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadDecoded);
    const exp = payload.exp;
    if (!exp) return false; // If no exp claim, assume valid
    // Current time in seconds. Add a 10-second safety buffer for network latency.
    return (Date.now() / 1000) > (exp - 10);
  } catch {
    return true; // If decoding fails, treat as expired/invalid
  }
}

// --------------------------------------------------------------------------
// Helper: Route checking for login redirection
// --------------------------------------------------------------------------
export function isProtectedRoute(pathname: string): boolean {
  const protectedPatterns = [
    /^\/profile(\/.*)?$/,
    /^\/orders(\/.*)?$/,
    /^\/wishlist(\/.*)?$/,
    /^\/checkout(\/.*)?$/,
    /^\/admin(\/.*)?$/,
    /^\/track-order(\/.*)?$/
  ];
  return protectedPatterns.some((pattern) => pattern.test(pathname));
}

// --------------------------------------------------------------------------
// Dedicated refresh Axios instance to bypass request/response interceptors
// --------------------------------------------------------------------------
const refreshInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

// --------------------------------------------------------------------------
// Shared Refresh Lock
// --------------------------------------------------------------------------
let refreshPromise: Promise<string | null> | null = null;

async function getOrRefreshAccessToken(): Promise<string | null> {
  const raw = localStorage.getItem('auth_user');
  if (!raw) return null;

  try {
    const user = JSON.parse(raw);
    const token = user?.token;
    const refreshToken = user?.refreshToken;

    if (!token) return null;

    // If access token is still valid, return it immediately
    if (!isTokenExpired(token)) {
      return token;
    }

    // Access token is expired. We need to refresh it using the refresh token.
    if (!refreshToken) {
      // No refresh token, clear session
      localStorage.removeItem('auth_user');
      window.dispatchEvent(new CustomEvent('auth:logout'));
      return null;
    }

    // Reuse existing refresh promise if already in progress
    if (refreshPromise) {
      return await refreshPromise;
    }

    refreshPromise = (async () => {
      try {
        const response = await refreshInstance.post('/api/auth/refresh', {
          refreshToken,
        });
        const newAccessToken = response.data.data.accessToken;
        user.token = newAccessToken;
        localStorage.setItem('auth_user', JSON.stringify(user));
        window.dispatchEvent(new CustomEvent('auth:update', { detail: user }));
        return newAccessToken;
      } catch (err) {
        // Refresh token is invalid/expired -> log out
        localStorage.removeItem('auth_user');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        throw err;
      } finally {
        refreshPromise = null;
      }
    })();

    return await refreshPromise;
  } catch (e) {
    localStorage.removeItem('auth_user');
    window.dispatchEvent(new CustomEvent('auth:logout'));
    return null;
  }
}

// --------------------------------------------------------------------------
// Primary Axios instance
// --------------------------------------------------------------------------
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

// --------------------------------------------------------------------------
// Request Interceptor — proactive refresh & attach JWT
// --------------------------------------------------------------------------
axiosInstance.interceptors.request.use(
  async (config: any) => {
    // Skip attaching/refreshing for authentication requests
    const isAuthRequest = config.url?.includes('/api/auth/');
    if (isAuthRequest) {
      return config;
    }

    try {
      const token = await getOrRefreshAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // If refresh failed, do not attach token, let the request proceed (e.g. if public)
    }

    if (config._retryCount === undefined) config._retryCount = 0;
    return config;
  },
  (error: any) => Promise.reject(error)
);

// --------------------------------------------------------------------------
// Response Interceptor — reactive handling & retries
// --------------------------------------------------------------------------
axiosInstance.interceptors.response.use(
  // ✅ Success — pass through unchanged
  (response: any) => response,

  async (error: any) => {
    const config = error.config;

    // ── 401 Unauthorized → Session expired or invalidated on server ─────
    if (error.response?.status === 401) {
      const isAuthRequest = config?.url?.includes('/api/auth/');

      if (isAuthRequest) {
        localStorage.removeItem('auth_user');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        if (isProtectedRoute(window.location.pathname)) {
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }

      if (config && !config._retry) {
        config._retry = true;

        try {
          // Attempt to get a fresh token or refresh it
          const token = await getOrRefreshAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(config);
          }
        } catch (refreshError) {
          // Refresh failed during reactive handling
          localStorage.removeItem('auth_user');
          window.dispatchEvent(new CustomEvent('auth:logout'));
          if (isProtectedRoute(window.location.pathname)) {
            window.location.href = '/auth/login';
          }
          return Promise.reject(error);
        }
      }

      // If already retried, clear session and redirect only if on protected route
      localStorage.removeItem('auth_user');
      window.dispatchEvent(new CustomEvent('auth:logout'));
      if (isProtectedRoute(window.location.pathname)) {
        window.location.href = '/auth/login';
      }
      return Promise.reject(error);
    }

    // ── 403 Forbidden → Redirect appropriately ────────────────────────────
    if (error.response?.status === 403) {
      const isAdminApiCall = config?.url?.includes('/api/admin');
      if (isAdminApiCall) {
        localStorage.removeItem('auth_user');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
      } else {
        window.location.href = '/';
      }
      return Promise.reject(error);
    }

    // ── Transient errors — ONE fast retry then propagate ─────────────────
    if (config && isRetryable(error)) {
      const retryCount = config._retryCount ?? 0;
      if (retryCount < MAX_RETRIES) {
        config._retryCount = retryCount + 1;
        await sleep(RETRY_DELAY_MS);
        try {
          return await axiosInstance(config);
        } catch (retryError) {
          return Promise.reject(retryError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
