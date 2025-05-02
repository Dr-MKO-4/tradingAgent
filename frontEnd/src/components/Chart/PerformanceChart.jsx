// src/components/Chart/PerformanceChart.jsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { sharpeRatio, maxDrawdown } from '../../utils/financeUtils';
export default function PerformanceChart({ metrics }) {
  const data = {
    labels: ['Sharpe','MaxDrawdown'],
    datasets: [{ label: 'Valeurs', data: [metrics.sharpe, metrics.drawdown] }]
  };
  return <Bar data={data} />;
}
