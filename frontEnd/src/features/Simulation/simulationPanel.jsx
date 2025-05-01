// src/features/Simulation/SimulationPanel.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { runSimulation } from './simulationSlice';
import { Line } from 'react-chartjs-2';
import Button from '../../components/Button/Button';

export default function SimulationPanel() {
  const dispatch = useDispatch();
  const { data, status, error } = useSelector((state) => state.simulation);

  const chartData = {
    labels: data.map((point) => point.date),
    datasets: [
      {
        label: 'Portefeuille',
        data: data.map((point) => point.portfolio_value),
        borderColor: 'rgba(75,192,192,1)',
        fill: false,
      },
    ],
  };

  return (
    <section>
      <Button onClick={() => dispatch(runSimulation({ symbol: 'BTC-USD', episodes: 50 }))}>
        Lancer Simulation
      </Button>
      {status === 'loading' && <p>Chargement…</p>}
      {status === 'succeeded' && <Line data={chartData} />}
      {status === 'failed' && <p className="error">Erreur : {error}</p>}
    </section>
  );
}
