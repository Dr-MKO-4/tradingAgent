// src/features/Simulation/simulationAPI.js
export async function runSimulationAPI(symbol, episodes) {
  const response = await fetch('/api/simulation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, episodes }),
  });
  const data = await response.json();
  return data;
}
