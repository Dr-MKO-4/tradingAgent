// src/services/api.js
import axios from 'axios';
const api = axios.create({
  baseURL: '/api',     // <-- proxy vers le backend
  headers: { 'Content-Type': 'application/json' },
});
export default api;
