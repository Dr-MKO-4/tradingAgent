//src/services/authService.js
import api from './api';

export async function loginUser(email, password) {
  try {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  } catch (err) {
    return { error: err.response?.data?.message || 'Login failed' };
  }
}

export function logoutUser() {
  // Optionnel : notifier le backend
  // await api.post('/auth/logout');
}
