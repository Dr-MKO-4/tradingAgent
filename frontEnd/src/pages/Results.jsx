// src/pages/Results.jsx : résultats de la dernière simulation
import React from 'react';
import { Link } from 'react-router-dom';
import { LuPlay, LuChartLine, LuWallet, LuTrendingUp, LuActivity, LuTrendingDown } from 'react-icons/lu';
import { useSimulation } from '../contexts/SimulationContext';
import PerformanceChart from '../components/Chart/PerformanceChart';
import TradingChart from '../components/Chart/TradingChart';
import Kpi from '../components/UI/Kpi';
import ActionPill from '../components/UI/ActionPill';
import { EmptyState, ErrorState } from '../components/UI/State';
import { money, pct, num, trend, seriesStats, isNum } from '../lib/format';
import { IS_DEMO } from '../lib/mode';
import { useLiveSim } from '../contexts/LiveSimContext';

const Results = () => {
  const ctx = useSimulation();
  const live = useLiveSim();
  const { status, progress, error } = ctx;
  // In demo mode the results are those of the current live session.
  const results = IS_DEMO ? live.sim.toResults() : ctx.results;
  const filters = IS_DEMO ? { crypto: live.sim.asset.symbol } : ctx.filters;

  if (status === 'running') {
    return (
      <section className="card enter">
        <div className="state" role="status" aria-live="polite">
          <span className="spinner" style={{ width: 22, height: 22, color: 'var(--accent)' }} aria-hidden="true" />
          <h3>Simulation en cours</h3>
          <p>L'agent s'entraîne sur les données historiques. Progression : <span className="num">{Math.round(progress)} %</span></p>
          <div className="meter" style={{ width: 260 }}><span style={{ width: `${Math.max(2, progress)}%` }} /></div>
        </div>
      </section>
    );
  }

  if (status === 'error' && !results) {
    return (
      <section className="card enter">
        <ErrorState title="La simulation a échoué" actions={<Link to="/simulation" className="btn">Retour à la configuration</Link>}>
          {error}
        </ErrorState>
      </section>
    );
  }

  if (!results) {
    return (
      <>
        <div className="page-head enter">
          <div>
            <h1>Résultats</h1>
            <p>Performance de la dernière simulation.</p>
          </div>
        </div>
        <section className="card enter enter-2">
          <EmptyState
            icon={LuChartLine}
            title="Aucun résultat disponible"
            actions={<Link to="/simulation" className="btn btn-primary"><LuPlay aria-hidden="true" />Lancer une simulation</Link>}
          >
            Lancez une simulation pour afficher la courbe de portefeuille, les métriques et les signaux de trading de l'agent.
          </EmptyState>
        </section>
      </>
    );
  }

  const portfolio = Array.isArray(results.portfolio) ? results.portfolio : [];
  const st = seriesStats(portfolio);
  const sharpe = Number(results.metrics?.sharpe);
  const signals = Array.isArray(results.tradingSignals) ? results.tradingSignals : [];

  return (
    <>
      <div className="page-head enter">
        <div>
          <h1>Résultats</h1>
          <p>Agent DQN{IS_DEMO ? ' (politique simulée, session en cours)' : ''} · {filters.crypto}/USD · {portfolio.length} points</p>
        </div>
        <div className="actions">
          <Link to="/simulation" className="btn btn-primary"><LuPlay aria-hidden="true" />Nouvelle simulation</Link>
        </div>
      </div>

      <section className="grid grid-kpi" aria-label="Indicateurs clés">
        <Kpi className="enter" label="Valeur finale" icon={LuWallet} value={money(st?.last)} delta={st && { raw: st.change, text: money(st.change) }} />
        <Kpi className="enter enter-2" label="Rendement total" icon={LuTrendingUp} value={<span className={trend(st?.ret)}>{pct(st?.ret)}</span>} foot="sur la période" />
        <Kpi className="enter enter-3" label="Ratio de Sharpe" icon={LuActivity} value={isNum(sharpe) ? num(sharpe, 2) : '-'} foot="rendement / risque" />
        <Kpi className="enter enter-4" label="Drawdown max." icon={LuTrendingDown} value={st ? pct(-st.maxDrawdown) : '-'} foot="calculé sur la courbe" />
      </section>

      <div className="grid grid-main">
        <section className="card enter enter-2" aria-labelledby="pf-title">
          <div className="card-head">
            <div>
              <h2 id="pf-title">Courbe de portefeuille</h2>
              <div className="sub">Valeur du portefeuille au fil du backtest</div>
            </div>
          </div>
          <div style={{ padding: '12px 12px 8px' }}>
            {portfolio.length > 1
              ? <TradingChart portfolio={portfolio} />
              : <EmptyState title="Série vide">Le backend n'a pas renvoyé de points de portefeuille.</EmptyState>}
          </div>
        </section>

        <div className="stack">
          <section className="card enter enter-3" aria-labelledby="metrics-title">
            <div className="card-head"><h2 id="metrics-title">Métriques</h2></div>
            <PerformanceChart metrics={results.metrics || {}} />
          </section>

          <section className="card enter enter-4" aria-labelledby="signals-title">
            <div className="card-head">
              <h2 id="signals-title">Indications de trading</h2>
              <span className="badge">{signals.length}</span>
            </div>
            {signals.length ? (
              <ul className="rows">
                {signals.map((signal, index) => (
                  <li key={index} title={signal.gainMessage}>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <ActionPill action={signal.action} />
                      {signal.gainMessage && <span className="meta">{signal.gainMessage}</span>}
                    </span>
                    <span className={`num ${trend(Number(signal.gain))}`}>{pct(Number(signal.gain), 2)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="card-body" style={{ color: 'var(--muted)' }}>Aucun signal renvoyé.</div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default Results;
