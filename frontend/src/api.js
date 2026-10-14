import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Track slow requests so the UI can explain a sleeping free-tier server.
let pending = 0;
let slowTimer = null;
const started = () => {
  pending += 1;
  if (!slowTimer) slowTimer = setTimeout(() => window.dispatchEvent(new Event('pl:slow')), 4000);
};
const finished = () => {
  pending = Math.max(0, pending - 1);
  if (pending === 0) {
    clearTimeout(slowTimer);
    slowTimer = null;
    window.dispatchEvent(new Event('pl:fast'));
  }
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pl_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  started();
  return config;
});

api.interceptors.response.use(
  (res) => { finished(); return res; },
  (err) => {
    finished();
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
