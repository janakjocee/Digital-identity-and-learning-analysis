/**
 * API Client
 * Axios instance with interceptors for authentication
 */

import axios from 'axios';

// Set VITE_API_URL in your Vercel environment variables to the backend URL, e.g.:
// https://digital-identity-and-learning-analysis.onrender.com/api
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Warn in the browser console when no VITE_API_URL is configured so the
// developer can spot the mis-configuration without digging through network
// logs.
if (!import.meta.env.VITE_API_URL) {
  console.warn(
    '[API] VITE_API_URL is not set. Falling back to http://localhost:5000/api.\n' +
    'Set VITE_API_URL in your Vercel environment variables and redeploy.'
  );
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // 30 s gives the Render free-tier backend enough time to wake up from
  // its sleep period on the first request of the day.
  timeout: 30000
});

// Request interceptor - add auth token
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

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
        
        localStorage.setItem('token', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;