// src/pages/LiveDashboard.jsx : dashboard of the demo mode, fed by the live simulation.
import React from 'react';
import { Link } from 'react-router-dom';
import {
  LuWallet, LuTrendingUp, LuActivity, LuArrowLeftRight, LuPlay, LuPause, LuInfo, LuMaximize2,
} from 'react-icons/lu';
import { useLiveView, useLiveSim, useLiveSnapshot } from '../contexts/LiveSimContext';
import CandleChart from '../components/Live/CandleChart';
import LiveEquity from '../components/Live/LiveEquity';
import Kpi from '../components/UI/Kpi';
import {
  AgentBrain, OrderLog, LiveWatchlist, LiveDot, SimBadge,
} from '../components/Live/LivePanels';
import { money, pct, num, trend, isNum } from '../lib/format';

function Kpis() {
  const sim = useLiveSnapshot();
  const m = sim.metrics();
  const spark = sim.equity.slice(-60).map((p) => p.value);
  const badge = <SimBadge short />;
  return (
    <section className="grid grid-kpi" aria-label="Indicateurs en direct">
      <Kpi label="Valeur du portefeuille" icon={LuWallet} value={money(m.value, 2)} delta={{ raw: m.pnl, text: `${m.pnl > 0 ? '+' : ''}${money(m.pnl, 2)}` }} spark={spark} badge={badge} />
      <Kpi label="Rendement" icon={LuTrendingUp} value={<span className={trend(m.ret)}>{pct(m.ret, 2)}</span>} foot={<>Buy &amp; Hold <span className={trend(m.benchRet)}>{pct(m.benchRet, 2)}</span></>} badge={badge} />
      <Kpi label="Sharpe glissant" icon={LuActivity} value={isNum(m.sharpe) ? num(m.sharpe, 2) : '-'} foot={`Drawdown max. ${pct(-m.maxDrawdown, 2)}`} badge={badge} />
      <Kpi label="Trades" icon={LuArrowLeftRight} value={m.trades} foot={isNum(m.winRate) ? `${num(m.winRate, 1)} % de ventes gagnantes` : 'aucune vente clôturée'} badge={badge} />
    </section>
  );
}

function PreviewHead() {
  const sim = useLiveSnapshot();
  const live = useLiveSim();
  return (
    <div className="card-head">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h2 id="preview-title">Aperçu live · {sim.asset.symbol}/USD</h2>
        <LiveDot playing={live.playing} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn icon-btn" onClick={live.toggle} aria-label={live.playing ? 'Mettre en pause' : 'Reprendre'}>
          {live.playing ? <LuPause aria-hidden="true" /> : <LuPlay aria-hidden="true" />}
        </button>
        <Link to="/simulation" className="btn"><LuMaximize2 aria-hidden="true" />Plein écran</Link>
      </div>
    </div>
  );
}

export default function LiveDashboard() {
  useLiveView();
  return (
    <>
      <div className="page-head enter">
        <div>
          <h1>Tableau de bord</h1>
          <p>Portefeuille et décisions de l'agent DQN, en direct.</p>
        </div>
        <div className="actions">
          <Link to="/history" className="btn">Historique</Link>
          <Link to="/simulation" className="btn btn-primary"><LuPlay aria-hidden="true" />Simulation en direct</Link>
        </div>
      </div>

      <div className="notice enter" role="note">
        <LuInfo aria-hidden="true" />
        <span>
          Mode démo : les montants viennent d'une <strong>simulation pédagogique exécutée dans le navigateur</strong> (marché synthétique,
          politique Dueling Q aux poids fixés à la main). Ce n'est ni le modèle entraîné réel, ni une performance réelle.
        </span>
      </div>

      <Kpis />

      <div className="grid grid-main">
        <section className="card enter enter-2" aria-labelledby="preview-title">
          <PreviewHead />
          <div style={{ padding: '8px 4px 4px 12px' }}>
            <CandleChart height={280} compact />
          </div>
        </section>
        <AgentBrain compactView />
      </div>

      <div className="grid grid-main">
        <section className="card enter enter-3" aria-labelledby="eq-title">
          <div className="card-head">
            <div>
              <h2 id="eq-title">Courbe d'équité</h2>
              <div className="sub">Agent comparé à acheter et conserver</div>
            </div>
            <div className="legend">
              <span><i />Agent DQN</span>
              <span><i className="bench" />Buy &amp; Hold</span>
            </div>
          </div>
          <div style={{ padding: '10px 4px 8px 12px' }}>
            <LiveEquity height={220} />
          </div>
        </section>
        <section className="card enter enter-4" aria-labelledby="market-title">
          <div className="card-head">
            <h2 id="market-title">Marché</h2>
            <span className="meta">depuis le début de la session</span>
          </div>
          <LiveWatchlist />
        </section>
      </div>

      <section className="card enter" aria-labelledby="decisions-title">
        <div className="card-head">
          <div>
            <h2 id="decisions-title">Derniers ordres de l'agent</h2>
            <div className="sub">Exécutés au cours de clôture, frais de 0,1 % inclus</div>
          </div>
          <SimBadge />
        </div>
        <OrderLog limit={8} compactView />
      </section>
    </>
  );
}
