// src/components/Live/DemoBanner.jsx : permanent demo-mode banner.
import React from 'react';

export default function DemoBanner() {
  return (
    <div className="demo-banner" role="note" title="Simulation pédagogique exécutée dans le navigateur, aucune donnée réelle">
      <span className="dot" aria-hidden="true" />Démo · simulation en direct
    </div>
  );
}
