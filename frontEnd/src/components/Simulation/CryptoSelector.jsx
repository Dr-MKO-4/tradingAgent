// src/components/Simulation/CryptoSelector.jsx
import React from 'react';
export default function CryptoSelector({ value, onChange }) {
  const cryptos = ['BTC','ETH','LTC','XRP'];
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}>
      {cryptos.map(c=> <option key={c} value={c}>{c}</option>)}
    </select>
  );
}
