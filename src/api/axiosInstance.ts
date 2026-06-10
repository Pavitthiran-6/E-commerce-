import axios from 'axios';

// --------------------------------------------------------------------------
// Configuration
// --------------------------------------------------------------------------

// Timeout for backend requests. 90s allows Render free-tier cold starts.
const REQUEST_TIMEOUT_MS = 90_000;

// Retry config for transient server/network errors.
// Up to 3 retries with exponential back-off so a Render cold-start (which
// can take up to 60 s) has time to recover without logging the user out.
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1_500; // 1.5 s, 3 s, 6 s

/** Status codes that are worth retrying (server/network issues, not auth). */
function isRetryable(error: any): boolean {
  if (!error.response) return true; // network error / timeout / offline
  const { status } = error.response;
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
    if (!exp) return false; // No exp claim → assume valid
    // 30-second safety buffer to account for network latency and clock skew.
    return (Date.now() / 1000) > (exp - 30);
  } catch {
    return true;
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
    /^\/track-order(\/.*)?$/,
  ];
  return protectedPatterns.some((pattern) => pattern.test(pathname));
}

// --------------------------------------------------------------------------
// Dedicated refresh Axios instance — bypasses all interceptors
// --------------------------------------------------------------------------
const refreshInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

// --------------------------------------------------------------------------
// Shared Refresh Lock — prevents parallel refresh requests
// --------------------------------------------------------------------------
let refreshPromise: Promise<string | null> | null = null;

/**
 * Returns a valid access token, proactively refreshing it if expired.
 *
 * Logout rules:
 *   ✅ Logout when: refresh endpoint returns 401 / 403 (token truly revoked)
 *   ❌ Do NOT logout on: network errors, 5xx from the refresh endpoint
 *        (those are transient; keep the stale token and let the request fail
 *         gracefully — the user can retry when the server wakes up)
 */
async function getOrRefreshAccessToken(): Promise<string | null> {
  const raw = localStorage.getItem('auth_user');
  if (!raw) return null;

  let user: any;
  try {
    user = JSON.parse(raw);
  } catch {
    // Corrupted storage — clear silently, do NOT fire logout event
    // (the session data was already unreadable, no UI change needed)
    localStorage.removeItem('auth_user');
    return null;
  }

  const token: string | undefined = user?.token;
  const refreshToken: string | undefined = user?.refreshToken;

  if (!token) return null;

  // Token still valid — return immediately
  if (!isTokenExpired(token)) return token;

  // Token expired but no refresh token — clear session
  if (!refreshToken) {
    localStorage.removeItem('auth_user');
    window.dispatchEvent(new CustomEvent('auth:logout'));
    return null;
  }

  // Reuse an already-in-flight refresh if one exists
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async (): Promise<string | null> => {
    try {
      const response = await refreshInstance.post('/api/auth/refresh', { refreshToken });
      const newAccessToken: string = response.data?.data?.accessToken;

      // Persist the new token and notify the UI
      user.token = newAccessToken;
      localStorage.setItem('auth_user', JSON.stringify(user));
      window.dispatchEvent(new CustomEvent('auth:update', { detail: user }));
      return newAccessToken;
    } catch (err: any) {
      const status: number | undefined = err?.response?.status;

      if (status === 401 || status === 403) {
        // Refresh token is definitively invalid — clear the session
        localStorage.removeItem('auth_user');
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
      // For network errors, 5xx from the refresh endpoint, etc., we do NOT
      // log the user out.  We return the stale token so the original request
      // can still be attempted.  The response interceptor will handle the
      // resulting error gracefully.
      return token ?? null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
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
    // Skip token logic for authentication endpoints
    const isAuthRequest = config.url?.includes('/api/auth/');
    if (isAuthRequest) return config;

    try {
      const token = await getOrRefreshAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // If something unexpected happens, proceed without a token.
      // The server will return 401 if the endpoint requires auth.
    }

    // Initialise retry counter
    if (config._retryCount === undefined) config._retryCount = 0;
    return config;
  },
  (error: any) => Promise.reject(error)
);

// --------------------------------------------------------------------------
// Response Interceptor — reactive auth handling & exponential-backoff retry
// --------------------------------------------------------------------------
axiosInstance.interceptors.response.use(
  // ✅ Success — pass through unchanged
  (response: any) => response,

  async (error: any) => {
    const config = error.config;
    const status: number | undefined = error.response?.status;

    // ── 401 Unauthorized ─────────────────────────────────────────────────
    // A genuine 401 means the server explicitly rejected the credentials.
    // We attempt ONE proactive token refresh first.  If that also returns
    // 401, we clear the session.  We never clear the session for 5xx or
    // network errors — those are server-side / infra issues.
    if (status === 401) {
      const isAuthEndpoint = config?.url?.includes('/api/auth/');

      // 401 on the login/refresh endpoint itself — credentials were wrong
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      // Attempt a single reactive refresh
      if (config && !config._authRetry) {
        config._authRetry = true;
        try {
          const token = await getOrRefreshAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(config);
          }
        } catch {
          // Refresh threw unexpectedly — fall through to logout
        }

        // Refresh produced no token — session is genuinely expired
        localStorage.removeItem('auth_user');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        if (isProtectedRoute(window.location.pathname)) {
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }

      // Already retried auth once and still 401
      localStorage.removeItem('auth_user');
      window.dispatchEvent(new CustomEvent('auth:logout'));
      if (isProtectedRoute(window.location.pathname)) {
        window.location.href = '/auth/login';
      }
      return Promise.reject(error);
    }

    // ── 403 Forbidden ─────────────────────────────────────────────────────
    // Only clear the session if the server says the USER THEMSELVES no longer
    // has the required role (e.g. an admin was demoted).  We detect this by
    // checking whether the error body explicitly says "role" or "access denied"
    // *and* the user is currently on an admin route.
    // A plain 403 on a non-admin resource (e.g. trying to view another user's
    // order) is NOT a logout trigger — just reject and let the UI handle it.
    if (status === 403) {
      const isAdminRoute = isProtectedRoute(window.location.pathname) &&
        window.location.pathname.startsWith('/admin');
      const serverSaysRoleIssue =
        error.response?.data?.message?.toLowerCase().includes('access') ||
        error.response?.data?.message?.toLowerCase().includes('role') ||
        error.response?.data?.errorCode === 'FORBIDDEN';

      if (isAdminRoute && serverSaysRoleIssue) {
        localStorage.removeItem('auth_user');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        window.location.href = '/auth/login';
      }
      // All other 403s: reject without touching the session
      return Promise.reject(error);
    }

    // ── Transient errors (5xx, 408, 429, network) — exponential back-off ──
    // These are infrastructure issues (Render cold start, network blip, etc.)
    // We retry up to MAX_RETRIES times with increasing delays.
    // We NEVER touch auth state here — the user stays logged in.
    if (config && isRetryable(error)) {
      const retryCount: number = config._retryCount ?? 0;
      if (retryCount < MAX_RETRIES) {
        config._retryCount = retryCount + 1;
        // Exponential back-off: 1.5 s → 3 s → 6 s
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, retryCount);
        await sleep(delay);
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
