import axios from 'axios';

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
      window.location.href = '/auth/login';
    }
    if (error.response?.status === 403) {
      window.location.href = '/';
    }
    if (!error.response) {
      // Network error — backend is down
      console.error('Network error — is the backend running?');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
