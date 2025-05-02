// src/components/Chart/TradingChart.jsx
import React from 'react';
import { Line } from 'react-chartjs-2';
export default function TradingChart({ portfolio }) {
  const data = {
    labels: portfolio.map(p => new Date(p.date).toLocaleDateString()),
    datasets: [{ label: 'Portefeuille', data: portfolio.map(p=>p.value), fill:false }]
  };
  return <Line data={data} />;
}
