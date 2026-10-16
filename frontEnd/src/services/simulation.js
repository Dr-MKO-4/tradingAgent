// src/services/simulation.js
import api from './api';
export async function startSimulation(cfg) {
  await api.post('/simulation/start', cfg);
}
export async function getStatus() {
  const res = await api.get('/simulation/status');
  return res.data; // { progress: 42 }
}
export async function listSimulations() {
  const res = await api.get('/simulation');
  return res.data; // [...]
}
