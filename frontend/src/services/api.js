import axios from 'axios';
import { API_URL } from '../config/constants';
import useAuthStore from '../store/useAuthStore';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 if not on login/register pages
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const onAuthPage = currentPath === '/login' || currentPath === '/register';
      if (!onAuthPage) {
        // Clear state via store
        try {
          const { logout } = useAuthStore.getState();
          logout();
        } catch {}
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?next=${next}`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
