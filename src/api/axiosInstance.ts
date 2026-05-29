import axios from 'axios';
import { handleMockRequest } from './mockDataHandler';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT token from localStorage
axiosInstance.interceptors.request.use((config: any) => {
  const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Response interceptor — handle 401 unauthorized and network errors
axiosInstance.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_user');
      if (window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login';
      }
    }
    if (error.response?.status === 403) {
      const isConfigUrlAdmin = error.config?.url?.includes('/api/admin');
      const isCurrentPageAdmin = window.location.pathname.startsWith('/admin');
      if (!isConfigUrlAdmin && !isCurrentPageAdmin) {
        window.location.href = '/';
      }
    }
    if (!error.response) {
      // Network error — backend is down or not deployed on Netlify
      console.warn('Backend unreachable. Falling back to Frontend Mock Mode for client demo...');
      return handleMockRequest(error.config);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
