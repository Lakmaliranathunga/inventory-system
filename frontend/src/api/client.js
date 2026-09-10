import axios from 'axios';
import { API_BASE_URL } from './config';

export const API_URL = (import.meta.env.VITE_API_URL || API_BASE_URL).replace(/\/$/, '');

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/') window.location.assign('/');
    }
    return Promise.reject(error);
  }
);

export default api;
