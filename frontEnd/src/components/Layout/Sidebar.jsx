// src/components/Layout/Sidebar.jsx
import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LuLayoutDashboard, LuSlidersHorizontal, LuChartLine, LuHistory, LuSettings, LuGithub, LuX,
} from 'react-icons/lu';
import { useSimulation } from '../../contexts/SimulationContext';
import CryptoSelector from '../Simulation/CryptoSelector';
import Brand from './Brand';
import { IS_DEMO } from '../../lib/mode';
import { useLiveSim } from '../../contexts/LiveSimContext';
import { ASSETS } from '../../lib/sim/market';

export const NAV = [
  { to: '/', label: 'Tableau de bord', icon: LuLayoutDashboard, end: true },
  { to: '/simulation', label: 'Simulation', icon: LuSlidersHorizontal },
  { to: '/results', label: 'Résultats', icon: LuChartLine },
  { to: '/history', label: 'Historique', icon: LuHistory },
  { to: '/settings', label: 'Paramètres', icon: LuSettings },
];

export default function Sidebar({ show, onHide }) {
  const { filters, setFilters } = useSimulation();
  const live = useLiveSim();
  const ref = useRef(null);

  // Génère dynamiquement l'agent en fonction de la crypto
  const dynamicAgent = filters.crypto ? `DQN ${filters.crypto}` : 'DQN';

  useEffect(() => {
    if (!show) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onHide(); };
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector('nav a')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [show, onHide]);

  return (
    <>
      <div className="backdrop" data-open={show} onClick={onHide} aria-hidden="true" />
      <aside ref={ref} className="sidebar" data-open={show} aria-label="Navigation principale">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Brand onClick={onHide} />
          {show && (
            <button type="button" className="btn btn-ghost icon-btn" onClick={onHide} aria-label="Fermer le menu">
              <LuX aria-hidden="true" />
            </button>
          )}
        </div>

        <nav className="nav">
          <div className="nav-label">Navigation</div>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={onHide}>
              <Icon aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-section">
          <div className="nav-label" style={{ paddingLeft: 8 }}>Filtres</div>
          <div className="field">
            <label htmlFor="filter-crypto">Crypto</label>
            {IS_DEMO ? (
              <select id="filter-crypto" className="select" value={live.config.asset} onChange={(e) => live.reset({ asset: e.target.value })}>
                {ASSETS.map((a) => <option key={a.symbol} value={a.symbol}>{a.symbol} · {a.name}</option>)}
              </select>
            ) : (
              <CryptoSelector
                id="filter-crypto"
                value={filters.crypto}
                onChange={(c) => setFilters((f) => ({ ...f, crypto: c, agent: `DQN ${c}` }))}
              />
            )}
          </div>
          <div className="field">
            <label htmlFor="filter-agent">Agent</label>
            <input id="filter-agent" className="input mono" value={IS_DEMO ? `DQN ${live.config.asset} · simulé` : dynamicAgent} readOnly />
          </div>
        </div>

        <div className="sidebar-foot">
          <a href="https://github.com/Dr-MKO-4/tradingAgent" target="_blank" rel="noreferrer">
            <LuGithub aria-hidden="true" /> Code source
          </a>
          <span className="mono">v0.1</span>
        </div>
      </aside>
    </>
  );
}
