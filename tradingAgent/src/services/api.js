import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

export async function fetchSimulations({ agent, crypto, filters }) {
  const response = await axios.get(
    `${API_URL}/simulations`,
    { params: { agent, crypto, ...filters } }
  );
  return response.data;
}
