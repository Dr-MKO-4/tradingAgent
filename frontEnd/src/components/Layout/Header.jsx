// src/components/Layout/Header.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import { LuMenu, LuMoon, LuSun } from 'react-icons/lu';
import { useTheme } from '../../contexts/ThemeContext';
import { useSimulation } from '../../contexts/SimulationContext';
import { NAV } from './Sidebar';
import Brand from './Brand';
import { IS_DEMO } from '../../lib/mode';
import { useLiveSim } from '../../contexts/LiveSimContext';

const STATUS = {
  idle: 'Agent inactif',
  running: 'Simulation en cours',
  done: 'Simulation terminée',
  error: 'Erreur de simulation',
};

export default function Header({ onMenuToggle }) {
  const { theme, toggle } = useTheme();
  const sim = useSimulation();
  const live = useLiveSim();
  const status = IS_DEMO ? (live.playing ? 'running' : 'idle') : sim.status;
  const { progress } = sim;
  const { pathname } = useLocation();
  const current = NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)));

  return (
    <header className="topbar">
      <button type="button" className="btn btn-ghost icon-btn menu-btn" onClick={onMenuToggle} aria-label="Ouvrir le menu">
        <LuMenu aria-hidden="true" />
      </button>
      <Brand compact />
      <div className="topbar-title">
        <span className="topbar-crumb">Crypto Trader / </span>
        {current ? current.label : 'Page introuvable'}
      </div>
      <div className="topbar-spacer" />
      <span className="status-pill" data-status={status} role="status" aria-live="polite">
        <span className="dot" aria-hidden="true" />
        <span className="label-long">{IS_DEMO ? (live.playing ? 'Simulation en direct' : 'Simulation en pause') : (STATUS[status] || STATUS.idle)}</span>
        {!IS_DEMO && status === 'running' && <span className="num">{Math.round(progress)} %</span>}
      </span>
      <button
        type="button"
        className="btn icon-btn"
        onClick={toggle}
        aria-label={theme === 'light' ? 'Activer le thème sombre' : 'Activer le thème clair'}
        title={theme === 'light' ? 'Thème sombre' : 'Thème clair'}
      >
        {theme === 'light' ? <LuMoon aria-hidden="true" /> : <LuSun aria-hidden="true" />}
      </button>
    </header>
  );
}
