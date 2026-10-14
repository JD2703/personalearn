import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pl_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('pl_token')) {
      localStorage.removeItem('pl_token');
      window.dispatchEvent(new Event('pl:logout'));
    }
    return Promise.reject(err);
  }
);

export const errorMessage = (err, fallback = 'Something went wrong. Try again.') =>
  err?.response?.data?.message || (err?.response ? fallback : 'Can’t reach the server. Check that the API is running.');

export default api;
