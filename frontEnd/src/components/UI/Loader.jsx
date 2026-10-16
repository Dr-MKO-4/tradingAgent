// src/components/UI/Loader.jsx : skeleton rows
import React from 'react';

export default function Loader({ rows = 5, label = 'Chargement…' }) {
  return (
    <div className="card-body" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: rows }, (_, i) => (
          <span key={i} className="skeleton" style={{ height: 14, width: `${92 - (i % 3) * 14}%` }} />
        ))}
      </div>
    </div>
  );
}
