import axios from 'axios';

// Since we serve via same origin or proxy, just use /api
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data?.error || { message: 'Network Error' });
  }
);
