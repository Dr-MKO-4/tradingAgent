// src/contexts/SimulationContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import * as simAPI from '../services/simulation';
import * as resultsAPI from '../services/results';
import useInterval from '../hooks/useInterval';

const SimulationContext = createContext();
export const useSimulation = () => useContext(SimulationContext);

function apiMessage(err) {
  if (err?.response?.status === 404) return "Le backend ne propose pas cette route (404). Vérifiez que l'API Flask est démarrée.";
  if (err?.response) return `Le serveur a répondu ${err.response.status}.${err.response.status >= 500 ? ' Le backend Python est-il démarré ?' : ''}`;
  if (err?.request) return "Impossible de joindre l'API (/api). Le backend est-il démarré ?";
  return err?.message || 'Erreur inconnue.';
}

// A valid results payload must contain a portfolio series.
function isResults(res) {
  return res && typeof res === 'object' && Array.isArray(res.portfolio);
}

export function SimulationProvider({ children }) {
  const [config, setConfig] = useState({});
  const [status, setStatus] = useState('idle'); // idle, running, done, error
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ crypto: 'BTC', agent: 'DQN' });

  // démarrer la simu
  const startSimulation = useCallback(async (cfg) => {
    setConfig(cfg);
    setError(null);
    setProgress(0);
    setStatus('running');
    try {
      await simAPI.startSimulation(cfg);
    } catch (err) {
      setStatus('error');
      setError(apiMessage(err));
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
  }, []);

  // polling toutes les 2s
  useInterval(async () => {
    if (status !== 'running') return;
    try {
      const st = await simAPI.getStatus();
      const p = Number(st?.progress);
      if (!Number.isFinite(p)) throw new Error("Réponse inattendue de /api/simulation/status.");
      setProgress(p);
      if (p >= 100) {
        const res = await resultsAPI.fetchResults(filters);
        if (!isResults(res)) throw new Error('Réponse inattendue de /api/simulation/results.');
        setResults(res);
        setStatus('done');
      }
    } catch (err) {
      setStatus('error');
      setError(apiMessage(err));
    }
  }, status === 'running' ? 2000 : null);

  const value = {
    config, status, progress, results, error, filters, setFilters,
    startSimulation, reset,
  };
  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}
