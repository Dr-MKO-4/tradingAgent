// src/pages/LiveSimulation.jsx : live in-browser simulation (demo mode, no backend).
import React from 'react';
import { Link } from 'react-router-dom';
import { LuInfo, LuChartLine } from 'react-icons/lu';
import { useLiveView, useLiveSim, useLiveSnapshot } from '../contexts/LiveSimContext';
import CandleChart from '../components/Live/CandleChart';
import LiveEquity from '../components/Live/LiveEquity';
import {
  LiveKpis, AgentBrain, OrderLog, LiveControls, LiveDot, SimBadge, priceFmt,
} from '../components/Live/LivePanels';
import { REGIMES } from '../lib/sim/market';
import { pct, trend } from '../lib/format';

function ChartHead() {
  const sim = useLiveSnapshot();
  const live = useLiveSim();
  const m = sim.metrics();
  const chg = ((m.price - sim.startPrice) / sim.startPrice) * 100;
  return (
    <div className="card-head">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h2 id="candles-title">{sim.asset.symbol}/USD · {sim.opts.interval}</h2>
          <LiveDot playing={live.playing} />
          <span className="badge" data-regime={m.regime}>Régime : {REGIMES[m.regime].label.toLowerCase()}</span>
        </div>
        <div className="sub">
          <span className="num strong" style={{ color: 'var(--text)' }}>{priceFmt(m.price, sim.asset.symbol)}</span>
          {' '}<span className={`num ${trend(chg)}`}>{pct(chg, 2)}</span> depuis le début de la session
        </div>
      </div>
      <div className="legend hide-sm">
        <span><i />EMA 12</span>
        <span><i className="bench" />SMA 50</span>
        <span><b className="tri up" aria-hidden="true">▲</b>Achat</span>
        <span><b className="tri down" aria-hidden="true">▼</b>Vente</span>
      </div>
    </div>
  );
}

export default function LiveSimulation() {
  useLiveView();
  return (
    <>
      <div className="page-head enter">
        <div>
          <h1>Simulation en direct</h1>
          <p>L'agent observe un marché synthétique et décide à chaque bougie : acheter, vendre ou conserver.</p>
        </div>
        <div className="actions">
          <Link to="/results" className="btn"><LuChartLine aria-hidden="true" />Résultats de la session</Link>
        </div>
      </div>

      <div className="notice enter" role="note">
        <LuInfo aria-hidden="true" />
        <span>
          <strong>Simulation pédagogique de la politique, pas le modèle entraîné réel.</strong>{' '}
          Les prix viennent d'une marche aléatoire géométrique à régimes (calme, tendance, choc) et les décisions
          d'un petit réseau Dueling Q aux poids fixés à la main, avec les mêmes indicateurs que l'agent Python
          (rendements, RSI, SMA/EMA, MACD, position, liquidités) et des frais de 0,1 %. Tout tourne dans votre navigateur.
        </span>
      </div>

      <LiveControls />
      <LiveKpis />

      <div className="grid grid-main">
        <section className="card enter enter-2" aria-labelledby="candles-title">
          <ChartHead />
          <div style={{ padding: '8px 4px 4px 12px' }}>
            <CandleChart height={400} />
          </div>
        </section>
        <AgentBrain />
      </div>

      <div className="grid grid-main grid-live2">
        <section className="card enter enter-3" aria-labelledby="eq-title">
          <div className="card-head">
            <div>
              <h2 id="eq-title">Équité en direct</h2>
              <div className="sub">Agent comparé à acheter et conserver (même capital, mêmes frais)</div>
            </div>
            <div className="legend">
              <span><i />Agent DQN</span>
              <span><i className="bench" />Buy &amp; Hold</span>
            </div>
          </div>
          <div style={{ padding: '10px 4px 8px 12px' }}>
            <LiveEquity height={250} />
          </div>
        </section>
        <section className="card enter enter-4" aria-labelledby="log-title">
          <div className="card-head">
            <h2 id="log-title">Journal des ordres</h2>
            <SimBadge />
          </div>
          <OrderLog />
        </section>
      </div>
    </>
  );
}
