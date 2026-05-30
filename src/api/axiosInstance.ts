import axios from 'axios';
import { handleMockRequest } from './mockDataHandler';

// --------------------------------------------------------------------------
// Configuration
// --------------------------------------------------------------------------

// Short connection probe timeout — just enough to know the backend is alive.
// If it doesn't respond in 3s, treat it as unreachable and switch to mock.
const CONNECT_TIMEOUT_MS = 3000;

// After the first real failure, do ONE fast retry (800ms) before giving up.
// We don't do long exponential backoff here because the mock handler is
// instantaneous — waiting 5+ seconds serves no user.
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
  timeout: CONNECT_TIMEOUT_MS, // Fast fail — don't block the UI for 12s
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
    // real HTTP request and go straight to the mock handler immediately.
    // We reject with a tagged error carrying the config so handleMockRequest
    // always receives a valid config (Axios does NOT attach .config to
    // CancelToken errors — that was the source of the TypeError bug).
    if (sessionStorage.getItem('belledonne_backend_unreachable') === 'true') {
      const mockError: any = new Error('Backend known to be unreachable');
      mockError.__isMockFallback = true;
      mockError.config = config;
      return Promise.reject(mockError);
    }

    if (config._retryCount === undefined) config._retryCount = 0;

    return config;
  },
  (error: any) => Promise.reject(error)
);

// --------------------------------------------------------------------------
// Response interceptor
// --------------------------------------------------------------------------
axiosInstance.interceptors.response.use(
  // ✅ Success — pass through unchanged
  (response: any) => response,

  async (error: any) => {
    // ── Immediate mock fallback (backend known to be down) ───────────────
    if (error?.__isMockFallback) {
      const cfg = error.config;
      if (!cfg) return Promise.reject(new Error('Mock fallback: missing request config'));
      return handleMockRequest(cfg);
    }

    // ── 401 Unauthorized ─────────────────────────────────────────────────
    if (error.response?.status === 401) {
      const isMockMode = sessionStorage.getItem('belledonne_backend_unreachable') === 'true';
      if (!isMockMode) {
        localStorage.removeItem('auth_user');
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
      }
      return Promise.reject(error);
    }

    // ── 403 Forbidden ─────────────────────────────────────────────────────
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

    // ── Network / server error — ONE fast retry then mock mode ───────────
    const config = error.config;

    if (config && isRetryable(error)) {
      const retryCount = config._retryCount ?? 0;

      if (retryCount < MAX_RETRIES) {
        config._retryCount = retryCount + 1;
        await sleep(RETRY_DELAY_MS);
        try {
          return await axiosInstance(config);
        } catch {
          // Retry also failed — fall through to mock mode below
        }
      }

      // Backend is genuinely unreachable — switch to mock mode instantly
      if (!error.response) {
        console.warn('Backend unreachable. Switching to Frontend Mock Mode...');
        sessionStorage.setItem('belledonne_backend_unreachable', 'true');
        return handleMockRequest(config);
      }
    }

    // Catch-all network error with no config
    if (!error.response && config) {
      console.warn('Backend unreachable. Switching to Frontend Mock Mode...');
      sessionStorage.setItem('belledonne_backend_unreachable', 'true');
      return handleMockRequest(config);
    }

    return Promise.reject(error);
  }
);

// --------------------------------------------------------------------------
// Client-side GET Cache Layer
// --------------------------------------------------------------------------

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 120000; // Cache for 2 minutes

const CACHEABLE_URLS = [
  '/api/products',
  '/api/categories',
  '/api/coupons',
  '/api/sales',
  '/api/admin/products',
  '/api/admin/categories',
  '/api/admin/coupons',
  '/api/admin/orders',
  '/api/admin/users'
];

function isCacheable(url: string | undefined): boolean {
  if (!url) return false;
  const cleanUrl = url.replace(/^https?:\/\/[^\/]+/, '');
  return CACHEABLE_URLS.some(p => cleanUrl.startsWith(p));
}

export const clearProductCache = () => {
  cache.clear();
};

const originalRequest = axiosInstance.request;
axiosInstance.request = async function (config: any): Promise<any> {
  const method = (config.method || 'get').toLowerCase();
  const url = config.url || '';
  
  if (method === 'get' && isCacheable(url)) {
    const token = localStorage.getItem('auth_user') || '';
    const cacheKey = `${url}:${JSON.stringify(config.params || {})}:${token}`;
    
    const cached = cache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
      return Promise.resolve(cached.data);
    }
    
    try {
      const response = await originalRequest.call(this, config);
      cache.set(cacheKey, { data: response, timestamp: Date.now() });
      return response;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  
  if (method !== 'get') {
    try {
      const response = await originalRequest.call(this, config);
      cache.clear(); // Clear all cache on any successful mutation
      return response;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  
  return originalRequest.call(this, config);
};

export default axiosInstance;
