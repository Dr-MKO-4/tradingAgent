// Chemin : src/services/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 10000
});

apiClient.interceptors.response.use(
  res => res,
  err => {
    console.error('API error', err);
    return Promise.reject(err);
  }
);

export default apiClient;
