// src/components/Live/LivePanels.jsx : React panels of the live simulation.
// They re-render from a throttled snapshot (useLiveSnapshot), not at every tick.
import React, { useEffect, useState } from 'react';
import {
  LuPlay, LuPause, LuRotateCcw, LuZap, LuShuffle, LuBrain,
} from 'react-icons/lu';
import { useLiveSim, useLiveSnapshot, SPEEDS } from '../../contexts/LiveSimContext';
import { ASSETS, REGIMES, assetInfo } from '../../lib/sim/market';
import ActionPill from '../UI/ActionPill';
import { money, pct, num, trend, isNum } from '../../lib/format';

export const priceFmt = (v, symbol) => {
  const d = assetInfo(symbol).decimals;
  return isNum(v) ? `${v.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d })} $` : '-';
};
const qtyFmt = (v) => (isNum(v) ? v.toLocaleString('fr-FR', { maximumSignificantDigits: 4 }) : '-');
export const simTime = (t) => {
  const d = new Date(t);
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};

export function SimBadge({ short = false }) {
  if (short) return <span className="badge badge-demo" title="Simulation pédagogique exécutée dans le navigateur">Simulé</span>;
  return <span className="badge badge-demo" title="Simulation pédagogique exécutée dans le navigateur">Politique simulée</span>;
}

export function LiveDot({ playing }) {
  return (
    <span className="live-dot" data-on={playing || undefined}>
      <span aria-hidden="true" />{playing ? 'En direct' : 'En pause'}
    </span>
  );
}

/* ---------- KPI strip ---------- */
export function LiveKpis({ compactView = false }) {
  const sim = useLiveSnapshot();
  const m = sim.metrics();
  const items = [
    { k: 'value', label: 'Valeur du portefeuille', value: money(m.value, 2), sub: `${money(m.cash)} liquidités` },
    { k: 'pnl', label: 'P&L', value: <span className={trend(m.pnl)}>{m.pnl > 0 ? '+' : ''}{money(m.pnl, 2)}</span>, sub: `frais ${money(m.fees, 2)}` },
    { k: 'ret', label: 'Rendement', value: <span className={trend(m.ret)}>{pct(m.ret, 2)}</span>, sub: <>B&amp;H <span className={trend(m.benchRet)}>{pct(m.benchRet, 2)}</span></> },
    { k: 'sharpe', label: 'Sharpe glissant', value: isNum(m.sharpe) ? num(m.sharpe, 2) : '-', sub: '100 dernières bougies' },
    { k: 'dd', label: 'Drawdown max.', value: pct(-m.maxDrawdown, 2), sub: 'depuis le sommet' },
    { k: 'win', label: 'Taux de réussite', value: isNum(m.winRate) ? `${num(m.winRate, 1)} %` : '-', sub: `${m.closedTrades} vente${m.closedTrades > 1 ? 's' : ''} clôturée${m.closedTrades > 1 ? 's' : ''}` },
    { k: 'trades', label: 'Trades', value: m.trades, sub: `${m.candles} bougies` },
  ];
  const shown = compactView ? items.filter((i) => ['value', 'ret', 'trades', 'win'].includes(i.k)) : items;
  return (
    <section className={`card kpi-strip${compactView ? ' compact' : ''}`} aria-label="Indicateurs en direct">
      {shown.map((i) => (
        <div key={i.k} className="kpi-cell" data-kpi={i.k}>
          <div className="kpi-label">{i.label}</div>
          <div className="kpi-value">{i.value}</div>
          <div className="kpi-sub">{i.sub}</div>
        </div>
      ))}
    </section>
  );
}

/* ---------- Agent brain ---------- */
const QROWS = [
  { idx: 1, key: 'buy', label: 'Acheter' },
  { idx: 2, key: 'sell', label: 'Vendre' },
  { idx: 0, key: 'hold', label: 'Conserver' },
];

export function AgentBrain({ compactView = false }) {
  const sim = useLiveSnapshot();
  const d = sim.decision;
  const ind = d?.indicators;
  const q = d?.q || [0, 0, 0];
  const maxAbs = Math.max(1, ...q.map(Math.abs));
  return (
    <section className="card brain" aria-labelledby="brain-title">
      <div className="card-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="state-icon" style={{ width: 32, height: 32, borderRadius: 8 }}><LuBrain aria-hidden="true" /></span>
          <div>
            <h2 id="brain-title">Cerveau de l'agent</h2>
            <div className="sub">Dueling Q : Q = V + A - moy(A)</div>
          </div>
        </div>
        <SimBadge />
      </div>
      <div className="card-body brain-body">
        <div className="brain-decision" aria-live="polite">
          <div>
            <div className="meta">Décision · {d ? simTime(d.t) : '-'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              {d ? <ActionPill action={d.name} /> : <span className="meta">en attente</span>}
              {d?.explore && <span className="badge badge-outline" title="Action aléatoire (exploration epsilon-greedy)">exploration</span>}
              {d && !d.executed && d.name !== 'hold' && <span className="badge badge-outline" title="Pas de cash ou pas de position">non exécutée</span>}
            </div>
          </div>
          <div className="brain-conf">
            <div className="meta">Confiance</div>
            <div className="num strong">{d ? `${num(d.confidence * 100, 0)} %` : '-'}</div>
          </div>
        </div>

        <ul className="qbars" aria-label="Valeurs Q par action">
          {QROWS.map((r) => {
            const v = q[r.idx];
            const wPct = (Math.abs(v) / maxAbs) * 50;
            return (
              <li key={r.key} data-best={d && d.greedy === r.idx ? true : undefined}>
                <span className="qlabel">Q({r.label.toLowerCase()})</span>
                <span className="qtrack" aria-hidden="true">
                  <span className={`qfill q-${r.key}${v < 0 ? ' neg' : ''}`} style={{ width: `${wPct}%`, left: v >= 0 ? '50%' : `${50 - wPct}%` }} />
                  <span className="qzero" />
                </span>
                <span className="num qval">{d ? num(v, 3) : '-'}</span>
              </li>
            );
          })}
        </ul>

        <dl className="brain-grid">
          <div><dt>Epsilon</dt><dd>{num(d?.epsilon ?? sim.policy.epsilon, 3)}</dd></div>
          <div><dt>V(s)</dt><dd>{d ? num(d.value, 3) : '-'}</dd></div>
          <div><dt>Taille</dt><dd>{d && d.name !== 'hold' ? `${num(d.size * 100, 0)} %` : '-'}</dd></div>
          {!compactView && (
            <>
              <div><dt>RSI 14</dt><dd>{ind ? num(ind.rsi, 1) : '-'}</dd></div>
              <div><dt>MACD hist.</dt><dd>{ind ? num((ind.hist / ind.close) * 1e4, 2) : '-'}<small> pb</small></dd></div>
              <div><dt>Régime</dt><dd>{REGIMES[sim.stream.regime.name].label}</dd></div>
            </>
          )}
        </dl>

        {!compactView && d?.features && (
          <div className="brain-inputs">
            <div className="meta">Entrées du réseau (normalisées, de -1 à 1)</div>
            <ul>
              {FEATURES.map((f, k) => {
                const v = d.features[k];
                return (
                  <li key={f}>
                    <span>{f}</span>
                    <span className="ftrack" aria-hidden="true"><span style={{ width: `${Math.abs(v) * 50}%`, left: v >= 0 ? '50%' : `${50 - Math.abs(v) * 50}%` }} /></span>
                    <span className="num">{num(v, 2)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

const FEATURES = ['Rendement 1', 'Rendement 5', 'RSI 14', 'Prix / SMA 20', 'Prix / SMA 50', 'EMA 12 - EMA 26', 'MACD hist.', 'Position', 'Liquidités'];

/* ---------- Order log ---------- */
export function OrderLog({ limit = 40, compactView = false }) {
  const sim = useLiveSnapshot();
  const rows = sim.orders.slice(-limit).reverse();
  return (
    <div className={`order-log${compactView ? ' compact' : ''}`} role="log" aria-live="off" aria-label="Journal des ordres">
      {rows.length === 0 ? (
        <div className="card-body meta">Aucun ordre pour l'instant : l'agent observe le marché.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Horodatage</th><th>Action</th><th className="r">Prix</th><th className="r">Quantité</th><th className="r">P&amp;L</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="fresh">
                <td className="num">{simTime(o.t)}</td>
                <td><ActionPill action={o.side} /></td>
                <td className="r num strong">{priceFmt(o.price, o.asset)}</td>
                <td className="r num">{qtyFmt(o.qty)}</td>
                <td className={`r num ${o.side === 'sell' ? trend(o.pnl) : 'flat'}`}>
                  {o.side === 'sell' ? `${o.pnl > 0 ? '+' : ''}${money(o.pnl, 2)}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ---------- Live watchlist ---------- */
export function LiveWatchlist() {
  const sim = useLiveSnapshot();
  const live = useLiveSim();
  return (
    <ul className="rows">
      {sim.watchlist().map((c) => (
        <li key={c.symbol} data-active={c.symbol === sim.asset.symbol || undefined}>
          <button type="button" className="asset asset-btn" onClick={() => c.symbol !== sim.asset.symbol && live.reset({ asset: c.symbol })} aria-label={`Trader ${c.name}`}>
            <span className="asset-icon" aria-hidden="true">{c.symbol}</span>
            <span style={{ textAlign: 'left' }}>
              {c.name}
              <span className="meta" style={{ display: 'block', fontWeight: 400 }}>{c.symbol}/USD · {REGIMES[c.regime].label.toLowerCase()}</span>
            </span>
          </button>
          <span style={{ textAlign: 'right' }}>
            <span className="num" style={{ display: 'block', color: 'var(--text)' }}>{priceFmt(c.price, c.symbol)}</span>
            <span className={`num ${trend(c.change)}`} style={{ fontSize: 12 }}>{pct(c.change, 2)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Controls ---------- */
export function LiveControls() {
  const live = useLiveSim();
  const { config, playing, speed } = live;
  const [capital, setCapital] = useState(config.capital);
  const [seed, setSeed] = useState(config.seed);
  const [flash, setFlash] = useState(null);
  useEffect(() => { setCapital(config.capital); setSeed(config.seed); }, [config]);
  useEffect(() => {
    if (!flash) return undefined;
    const id = setTimeout(() => setFlash(null), 2600);
    return () => clearTimeout(id);
  }, [flash]);

  const apply = (patch = {}) => live.reset({ capital: Math.max(100, Number(capital) || 10000), seed: Number(seed) || 0, randomSeed: false, ...patch });

  return (
    <section className="card live-controls" aria-label="Contrôles de la simulation">
      <div className="ctrl-group">
        <button type="button" className="btn btn-primary" onClick={live.toggle} aria-pressed={playing} data-live-toggle>
          {playing ? <><LuPause aria-hidden="true" />Pause</> : <><LuPlay aria-hidden="true" />Lecture</>}
        </button>
        <div className="segmented" role="group" aria-label="Vitesse">
          {SPEEDS.map((s) => (
            <button key={s} type="button" aria-pressed={speed === s} onClick={() => live.setSpeed(s)} data-speed={s}>×{s}</button>
          ))}
        </div>
      </div>

      <div className="ctrl-group grow">
        <label className="ctrl-field">
          <span>Actif</span>
          <select className="select" value={config.asset} onChange={(e) => apply({ asset: e.target.value })} data-live-asset>
            {ASSETS.map((a) => <option key={a.symbol} value={a.symbol}>{a.symbol} · {a.name}</option>)}
          </select>
        </label>
        <label className="ctrl-field">
          <span>Capital <code>USD</code></span>
          <input className="input" type="number" min="100" step="500" value={capital} onChange={(e) => setCapital(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && apply()} />
        </label>
        <label className="ctrl-field seed">
          <span>Graine</span>
          <span className="seed-row">
            <input className="input" type="number" min="0" step="1" value={seed} onChange={(e) => setSeed(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && apply()} />
            <button type="button" className="btn icon-btn" title="Graine aléatoire" aria-label="Relancer avec une graine aléatoire" onClick={() => { live.reset({ capital: Math.max(100, Number(capital) || 10000), randomSeed: true }); }}>
              <LuShuffle aria-hidden="true" />
            </button>
          </span>
        </label>
      </div>

      <div className="ctrl-group">
        <button type="button" className="btn" onClick={() => apply()} data-live-reset><LuRotateCcw aria-hidden="true" />Réinitialiser</button>
        <button
          type="button"
          className="btn btn-shock"
          data-live-shock
          onClick={() => {
            const d = live.shock();
            setFlash(d < 0 ? 'Choc baissier injecté' : 'Choc haussier injecté');
          }}
        >
          <LuZap aria-hidden="true" />Choc de marché
        </button>
      </div>
      <div className="sr-only" role="status" aria-live="polite">{flash || ''}</div>
      {flash && <div className="shock-flash" aria-hidden="true">{flash}</div>}
    </section>
  );
}
