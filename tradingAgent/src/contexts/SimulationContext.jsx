// src/contexts/SimulationContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import * as simAPI from '../services/simulation';
import * as resultsAPI from '../services/results';
import useInterval from '../hooks/useInterval';

const SimulationContext = createContext();
export const useSimulation = () => useContext(SimulationContext);

export function SimulationProvider({ children }) {
  const [config, setConfig] = useState({});
  const [status, setStatus] = useState('idle'); // idle, running, done, error
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [filters, setFilters] = useState({ crypto: 'BTC', agent: 'DQN' });

  // démarrer la simu
  const startSimulation = useCallback(async (cfg) => {
    setConfig(cfg);
    setStatus('running');
    await simAPI.startSimulation(cfg);
  }, []);

  // polling toutes les 2s
  useInterval(async () => {
    if (status === 'running') {
      try {
        const st = await simAPI.getStatus();
        setProgress(st.progress);
        if (st.progress === 100) {
          setStatus('done');
          const res = await resultsAPI.fetchResults(filters);
          setResults(res);
        }
      } catch {
        setStatus('error');
      }
    }
  }, status === 'running' ? 2000 : null);

  const value = {
    config, status, progress, results, filters, setFilters,
    startSimulation
  };
  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}
