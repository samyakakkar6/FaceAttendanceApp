import axios from 'axios';
import { LocalStorage } from 'quasar';

const apiClient = axios.create({
  baseURL: `${process.env.API_URL || 'http://localhost:3000'}/api/v1`,
  timeout: 15_000,
});

// Token injected at request time — avoids circular import with auth store.
// Use Quasar LocalStorage so the encoding matches how the auth store wrote it.
apiClient.interceptors.request.use(config => {
  const token = LocalStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401 without importing the router
apiClient.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      LocalStorage.remove('token');
      LocalStorage.remove('user');
      window.location.hash = '#/login';
    }
    return Promise.reject(err);
  }
);

export default apiClient;
