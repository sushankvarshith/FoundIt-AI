import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30s timeout to prevent hanging requests
});

// Request interceptor - attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('findit_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors with retry for 5xx
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Retry once on 5xx server errors (not on auth or client errors)
    if (
      error.response?.status >= 500 &&
      !config._retried &&
      config.method !== 'post' // Don't retry POST (could cause duplicates)
    ) {
      config._retried = true;
      await new Promise(r => setTimeout(r, 1000)); // Wait 1s before retry
      return api(config);
    }

    if (error.response?.status === 401) {
      // Token expired or invalid
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('findit_token');
        window.location.href = '/login';
      }
    }

    // Network error (no response at all)
    if (!error.response && error.code === 'ERR_NETWORK') {
      error.message = 'Unable to connect to server. Please check your connection.';
    }

    return Promise.reject(error);
  }
);

export default api;
