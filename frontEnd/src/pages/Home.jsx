// src/pages/Home.jsx : tableau de bord
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LuWallet, LuCoins, LuTrendingUp, LuBanknote, LuPlay, LuInfo, LuBot, LuArrowUpRight, LuArrowDownRight,
} from 'react-icons/lu';
import { useSimulation } from '../contexts/SimulationContext';
import EquityChart from '../components/Chart/EquityChart';
import Kpi from '../components/UI/Kpi';
import ActionPill from '../components/UI/ActionPill';
import { DEMO_EQUITY, DEMO_PORTFOLIO, DEMO_AGENT, DEMO_WATCHLIST, DEMO_DECISIONS } from '../lib/demo';
import { money, pct, num, trend, dateTime, seriesStats } from '../lib/format';

const RANGES = [
  { key: '1M', days: 30 },
  { key: '3M', days: 90 },
  { key: 'Tout', days: Infinity },
];

const DemoBadge = () => <span className="badge badge-demo" title="Données de démonstration">Démo</span>;

export default function Home() {
  const { results, filters } = useSimulation();
  const [range, setRange] = useState('Tout');

  // Real data from the last simulation if available, demo data otherwise.
  const live = Array.isArray(results?.portfolio) && results.portfolio.length > 1;
  const equity = live ? results.portfolio : DEMO_EQUITY;
  const decisions = live && Array.isArray(results.tradingSignals) && results.tradingSignals.length
    ? results.tradingSignals.map((s, i) => ({ ...s, asset: filters.crypto, key: i }))
    : null;

  const shown = useMemo(() => {
    const r = RANGES.find((x) => x.key === range);
    return Number.isFinite(r.days) ? equity.slice(-r.days) : equity;
  }, [equity, range]);

  const stats = seriesStats(shown);
  const all = seriesStats(equity);
  const spark = equity.filter((_, i) => i % 6 === 0).map((p) => p.value);

  const kpis = live
    ? [
      { label: 'Capital initial', icon: LuCoins, value: money(all.first) },
      { label: 'Valeur finale', icon: LuWallet, value: money(all.last), delta: { raw: all.change, text: money(all.change) }, spark },
      { label: 'Rendement', icon: LuTrendingUp, value: <span className={trend(all.ret)}>{pct(all.ret)}</span>, foot: 'sur la période' },
      { label: 'Drawdown max.', icon: LuBanknote, value: pct(-all.maxDrawdown) },
    ]
    : [
      { label: 'Capital investi', icon: LuCoins, value: money(DEMO_PORTFOLIO.invested), foot: 'Montant de départ', badge: <DemoBadge /> },
      { label: 'Valeur du portefeuille', icon: LuWallet, value: money(DEMO_PORTFOLIO.value), delta: { raw: DEMO_PORTFOLIO.value - DEMO_PORTFOLIO.invested, text: money(DEMO_PORTFOLIO.value - DEMO_PORTFOLIO.invested) }, spark, badge: <DemoBadge /> },
      { label: 'Rendement', icon: LuTrendingUp, value: <span className="up">{pct(DEMO_PORTFOLIO.returnPct)}</span>, foot: 'depuis le lancement', badge: <DemoBadge /> },
      { label: 'Liquidités', icon: LuBanknote, value: money(DEMO_PORTFOLIO.cash), foot: 'Portefeuille électronique', badge: <DemoBadge /> },
    ];

  return (
    <>
      <div className="page-head enter">
        <div>
          <h1>Tableau de bord</h1>
          <p>Suivi du portefeuille et des décisions de l'agent DQN.</p>
        </div>
        <div className="actions">
          <Link to="/history" className="btn">Historique</Link>
          <Link to="/simulation" className="btn btn-primary"><LuPlay aria-hidden="true" />Nouvelle simulation</Link>
        </div>
      </div>

      {!live && (
        <div className="notice enter" role="note">
          <LuInfo aria-hidden="true" />
          <span>
            Les montants de cette page sont des <strong>données de démonstration</strong> générées localement, pas des performances réelles.
            Lancez une simulation pour afficher vos propres résultats.
          </span>
        </div>
      )}

      <section className="grid grid-kpi" aria-label="Indicateurs clés">
        {kpis.map((k, i) => (
          <Kpi key={k.label} {...k} className={`enter enter-${i + 1}`} />
        ))}
      </section>

      <div className="grid grid-main">
        <section className="card card-fill enter enter-2" aria-labelledby="equity-title">
          <div className="equity-head">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 id="equity-title" style={{ fontSize: 13.5 }}>Courbe d'équité</h2>
                {live ? <span className="badge">Dernière simulation</span> : <DemoBadge />}
              </div>
              <div className="equity-value" style={{ marginTop: 6 }}>{money(stats?.last)}</div>
              <div className="equity-meta">
                <span className={`delta ${trend(stats?.change)}`}>
                  {trend(stats?.change) === 'up' ? <LuArrowUpRight aria-hidden="true" /> : <LuArrowDownRight aria-hidden="true" />}
                  {money(stats?.change)} ({pct(stats?.ret)})
                </span>
                <span>sur {range === 'Tout' ? 'toute la période' : range}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
              <div className="segmented" role="group" aria-label="Période affichée">
                {RANGES.map((r) => (
                  <button key={r.key} type="button" aria-pressed={range === r.key} onClick={() => setRange(r.key)}>{r.key}</button>
                ))}
              </div>
              <div className="legend hide-sm">
                <span><i />Agent DQN</span>
                {!live && <span><i className="bench" />Buy &amp; Hold</span>}
              </div>
            </div>
          </div>
          <div className="card-grow" style={{ padding: '8px 12px 12px' }}>
            <EquityChart key={range} data={shown} height={290} fill />
          </div>
        </section>

        <div className="stack">
          <section className="card enter enter-3" aria-labelledby="agent-title">
            <div className="card-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="state-icon" style={{ width: 32, height: 32, borderRadius: 8 }}><LuBot aria-hidden="true" /></span>
                <div>
                  <h2 id="agent-title">Agent {DEMO_AGENT.name} · {filters.crypto || DEMO_AGENT.asset}</h2>
                  <div className="sub">Politique epsilon-greedy</div>
                </div>
              </div>
              <DemoBadge />
            </div>
            <dl className="agent-grid">
              <div><dt>Épisodes</dt><dd>{DEMO_AGENT.episodes}</dd></div>
              <div><dt>Epsilon</dt><dd>{num(DEMO_AGENT.epsilon, 2)}</dd></div>
              <div><dt>Gamma</dt><dd>{num(DEMO_AGENT.gamma, 2)}</dd></div>
              <div><dt>Learning rate</dt><dd>{DEMO_AGENT.lr}</dd></div>
              <div><dt>Trades</dt><dd>{DEMO_AGENT.trades}</dd></div>
              <div><dt>Taux de réussite</dt><dd>{num(DEMO_AGENT.winRate, 1)} %</dd></div>
            </dl>
          </section>

          <section className="card enter enter-4" aria-labelledby="market-title">
            <div className="card-head">
              <h2 id="market-title">Marché</h2>
              <DemoBadge />
            </div>
            <ul className="rows">
              {DEMO_WATCHLIST.map((c) => (
                <li key={c.symbol}>
                  <span className="asset">
                    <span className="asset-icon" aria-hidden="true">{c.symbol}</span>
                    <span>
                      {c.name}
                      <span className="meta" style={{ display: 'block', fontWeight: 400 }}>{c.symbol}/USD</span>
                    </span>
                  </span>
                  <span style={{ textAlign: 'right' }}>
                    <span className="num" style={{ display: 'block', color: 'var(--text)' }}>{money(c.price, c.price < 10 ? 2 : 0)}</span>
                    <span className={`num ${trend(c.change)}`} style={{ fontSize: 12 }}>{pct(c.change)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <section className="card enter" aria-labelledby="decisions-title">
        <div className="card-head">
          <div>
            <h2 id="decisions-title">Dernières décisions de l'agent</h2>
            <div className="sub">Actions choisies par le réseau Q (acheter, vendre, conserver)</div>
          </div>
          {decisions ? <span className="badge">Dernière simulation</span> : <DemoBadge />}
        </div>
        <div className="table-wrap">
          {decisions ? (
            <table className="table">
              <thead>
                <tr><th>#</th><th>Actif</th><th>Action</th><th className="r">Gain</th><th>Détail</th></tr>
              </thead>
              <tbody>
                {decisions.map((d) => (
                  <tr key={d.key}>
                    <td className="num">{d.key + 1}</td>
                    <td><span className="asset"><span className="asset-icon" aria-hidden="true">{d.asset}</span>{d.asset}</span></td>
                    <td><ActionPill action={d.action} /></td>
                    <td className={`r num ${trend(Number(d.gain))}`}>{pct(Number(d.gain), 2)}</td>
                    <td>{d.gainMessage || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Horodatage</th><th>Actif</th><th>Action</th>
                  <th className="r">Prix</th><th className="r hide-sm">Quantité</th><th className="r hide-sm">Écart Q</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_DECISIONS.map((d) => (
                  <tr key={d.t}>
                    <td className="num">{dateTime(d.date)}</td>
                    <td><span className="asset"><span className="asset-icon" aria-hidden="true">{d.asset}</span>{d.asset}</span></td>
                    <td><ActionPill action={d.action} /></td>
                    <td className="r num strong">{money(d.price)}</td>
                    <td className="r num hide-sm">{d.qty ? num(d.qty, 3) : '-'}</td>
                    <td className="r num hide-sm">{num(d.q, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
}
