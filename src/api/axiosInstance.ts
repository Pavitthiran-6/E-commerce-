import axios from 'axios';
import { handleMockRequest } from './mockDataHandler';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT token and handle fast-fallback for unreachable backend
axiosInstance.interceptors.request.use(
  (config: any) => {
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }

    // Fast-fallback to mock mode if backend was previously detected as down
    if (sessionStorage.getItem('belledonne_backend_unreachable') === 'true') {
      config.cancelToken = new axios.CancelToken((cancel) => cancel('Backend known to be unreachable'));
    }

    return config;
  },
  (error: any) => Promise.reject(error)
);

// Response interceptor — handle 401 unauthorized, network errors, and fast-fallback cancels
axiosInstance.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    // Intercept fast-fallback cancels
    if (axios.isCancel(error) && error.message === 'Backend known to be unreachable') {
      return handleMockRequest(error.config);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('auth_user');
      if (window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login';
      }
    }
    if (error.response?.status === 403) {
      const isAdminApiCall = error.config?.url?.includes('/api/admin');
      if (isAdminApiCall) {
        // 403 on admin API = token expired/invalid — force re-login
        localStorage.removeItem('auth_user');
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login';
        }
      } else {
        window.location.href = '/';
      }
    }
    if (!error.response) {
      // Network error — backend is down or not deployed on Netlify
      console.warn('Backend unreachable. Falling back to Frontend Mock Mode for client demo...');
      sessionStorage.setItem('belledonne_backend_unreachable', 'true');
      return handleMockRequest(error.config);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
