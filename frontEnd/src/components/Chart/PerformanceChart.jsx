// src/components/Chart/PerformanceChart.jsx
// Metrics returned by the API ({ sharpe, drawdown }) shown as compact gauges.
import React from 'react';
import { num, isNum } from '../../lib/format';

export default function PerformanceChart({ metrics }) {
  const sharpe = Number(metrics?.sharpe);
  const rawDd = Number(metrics?.drawdown);
  // drawdown may be returned as a ratio (0.08) or a percentage (8)
  const dd = isNum(rawDd) ? (Math.abs(rawDd) <= 1 ? Math.abs(rawDd) * 100 : Math.abs(rawDd)) : NaN;
  const rows = [
    { label: 'Ratio de Sharpe', value: isNum(sharpe) ? num(sharpe, 2) : '-', fill: isNum(sharpe) ? Math.min(Math.max(sharpe / 3, 0), 1) : 0, hint: 'Rendement ajusté du risque' },
    { label: 'Drawdown maximal', value: isNum(dd) ? `${num(dd, 1)} %` : '-', fill: isNum(dd) ? Math.min(dd / 50, 1) : 0, hint: 'Perte maximale depuis un sommet', tone: 'down' },
  ];
  return (
    <ul className="rows">
      {rows.map((r) => (
        <li key={r.label} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 550 }}>{r.label}</div>
              <div className="meta">{r.hint}</div>
            </div>
            <div className="num" style={{ fontSize: 18, fontWeight: 600 }}>{r.value}</div>
          </div>
          <div className="meter" aria-hidden="true">
            <span style={{ width: `${r.fill * 100}%`, background: r.tone === 'down' ? 'var(--down)' : undefined }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
