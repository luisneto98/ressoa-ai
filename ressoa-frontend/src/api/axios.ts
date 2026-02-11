import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

// Validate required environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL && import.meta.env.MODE === 'production') {
  throw new Error(
    'CRITICAL: VITE_API_URL não configurado em produção! Configure em .env.production'
  );
}

// Create axios instance with base URL
export const apiClient = axios.create({
  baseURL: API_BASE_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Plain axios instance for refresh token (no interceptors to prevent infinite loop)
const plainAxios = axios.create({
  baseURL: API_BASE_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Inject access token into every request
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Automatic token refresh on 401
apiClient.interceptors.response.use(
  (response) => response, // Pass through successful responses
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { refreshToken } = useAuthStore.getState();

      // If we have a refresh token, try to refresh
      if (refreshToken) {
        try {
          // Use plainAxios to avoid triggering interceptor again (prevent infinite loop)
          const { data } = await plainAxios.post('/auth/refresh', { refreshToken });

          // Update store with new tokens
          useAuthStore.getState().login(
            {
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            },
            data.user
          );

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          useAuthStore.getState().logout();
          // Dispatch custom event for App to handle navigation (preserves SPA)
          window.dispatchEvent(new CustomEvent('auth:logout'));
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, logout and redirect
        useAuthStore.getState().logout();
        // Dispatch custom event for App to handle navigation (preserves SPA)
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }

    return Promise.reject(error);
  }
);
