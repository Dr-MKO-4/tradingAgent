// src/components/Chart/TradingChart.jsx
import React from 'react';
import EquityChart from './EquityChart';

export default function TradingChart({ portfolio, height = 300 }) {
  return <EquityChart data={portfolio} height={height} valueLabel="Portefeuille" />;
}
