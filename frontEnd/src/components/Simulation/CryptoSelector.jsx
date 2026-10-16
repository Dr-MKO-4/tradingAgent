// src/components/Simulation/CryptoSelector.jsx
import React from 'react';

export const CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'LTC', name: 'Litecoin' },
  { symbol: 'XRP', name: 'XRP' },
];

export default function CryptoSelector({ value, onChange, id, className = 'select' }) {
  return (
    <select id={id} className={className} value={value || ''} onChange={(e) => onChange(e.target.value)}>
      {CRYPTOS.map((c) => (
        <option key={c.symbol} value={c.symbol}>{c.symbol} · {c.name}</option>
      ))}
    </select>
  );
}
