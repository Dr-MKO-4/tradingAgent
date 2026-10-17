// src/services/simulationService.js

import api from './api';

export async function fetchSimulations({ agent, crypto, filters }) {
  const res = await api.get('/simulations', {
    params: { agent, crypto, ...filters }
  });
  return res.data;
}
