// src/services/results.js
import api from './api';
export async function fetchResults(filters) {
  const res = await api.get('/simulation/results', { params: filters });
  return res.data; // { portfolio: [...], metrics: {...} }
}
