// src/components/Layout/Brand.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Brand({ compact = false, onClick }) {
  return (
    <Link to="/" className={`brand${compact ? ' brand-compact' : ''}`} onClick={onClick} aria-label="Crypto Trader DQN, accueil">
      <span className="brand-mark" aria-hidden="true"><span /></span>
      <span className="brand-name">
        <strong>Crypto Trader</strong>
        <small>{compact ? 'DQN' : 'Deep Q-Learning'}</small>
      </span>
    </Link>
  );
}
