// src/components/Chart/EquityChart.jsx
// Lightweight responsive SVG equity curve (no chart library needed).
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { money, date as fmtDate, pct } from '../../lib/format';

function niceTicks(min, max, count = 4) {
  const span = max - min || 1;
  const raw = span / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) || raw;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(v);
  return { lo, hi, ticks };
}

function compact(v) {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k`;
  return v.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

export default function EquityChart({
  data,
  height = 280,
  valueLabel = 'Agent DQN',
  benchLabel = 'Buy & Hold',
  ariaLabel,
  fill = false,
}) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(800);
  const [boxH, setBoxH] = useState(0);
  const [hover, setHover] = useState(null);
  const gid = useId().replace(/:/g, '');

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const update = () => {
      setWidth(Math.max(260, el.clientWidth));
      setBoxH(el.clientHeight);
    };
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pad = { t: 12, r: 52, b: 26, l: 4 };
  const w = width;
  const h = fill ? Math.max(height, boxH) : height;
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;

  const model = useMemo(() => {
    const pts = (data || []).filter((d) => Number.isFinite(Number(d.value)));
    if (pts.length < 2) return null;
    const hasBench = pts.some((d) => Number.isFinite(d.benchmark));
    const all = pts.flatMap((d) => (hasBench ? [d.value, d.benchmark] : [d.value])).filter(Number.isFinite);
    const { lo, hi, ticks } = niceTicks(Math.min(...all), Math.max(...all));
    const x = (i) => pad.l + (i / (pts.length - 1)) * iw;
    const y = (v) => pad.t + (1 - (v - lo) / (hi - lo || 1)) * ih;
    const line = (key) => pts.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join('');
    const main = line('value');
    const area = `${main}L${x(pts.length - 1).toFixed(1)},${(pad.t + ih).toFixed(1)}L${x(0).toFixed(1)},${(pad.t + ih).toFixed(1)}Z`;
    const xTickCount = Math.min(5, Math.max(2, Math.floor(iw / 140)));
    const xTicks = Array.from({ length: xTickCount }, (_, k) => Math.round((k / (xTickCount - 1)) * (pts.length - 1)));
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(x(i) - x(i - 1), y(pts[i].value) - y(pts[i - 1].value));
    return { pts, hasBench, ticks, x, y, main, area, bench: hasBench ? line('benchmark') : null, xTicks, len: Math.ceil(len) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, iw, ih]);

  if (!model) return null;
  const { pts, hasBench, ticks, x, y, main, area, bench, xTicks, len } = model;

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * w;
    const i = Math.round(((px - pad.l) / iw) * (pts.length - 1));
    setHover(Math.max(0, Math.min(pts.length - 1, i)));
  };
  const onKey = (e) => {
    if (e.key === 'ArrowRight') setHover((i) => Math.min(pts.length - 1, (i ?? pts.length - 2) + 1));
    else if (e.key === 'ArrowLeft') setHover((i) => Math.max(0, (i ?? pts.length) - 1));
    else if (e.key === 'Escape') setHover(null);
  };

  const first = pts[0].value;
  const last = pts[pts.length - 1].value;
  const hp = hover != null ? pts[hover] : null;
  const tipLeft = hp ? Math.min(Math.max(x(hover) / w * 100, 0), 100) : 0;

  return (
    <div className={`chart-wrap${fill ? ' fill' : ''}`} ref={wrapRef} style={fill ? { minHeight: height } : undefined}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        height={h}
        role="img"
        aria-label={ariaLabel || `Courbe d'équité : de ${money(first)} à ${money(last)} (${pct(((last - first) / first) * 100)}). Flèches gauche et droite pour parcourir les points.`}
        tabIndex={0}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        onKeyDown={onKey}
        onBlur={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line className="chart-grid" x1={pad.l} x2={pad.l + iw} y1={y(t)} y2={y(t)} />
            <text className="chart-axis" x={w - 4} y={y(t) + 4} textAnchor="end">{compact(t)}</text>
          </g>
        ))}
        {xTicks.map((i, k) => (
          <text
            key={i}
            className="chart-axis"
            x={x(i)}
            y={h - 6}
            textAnchor={k === 0 ? 'start' : k === xTicks.length - 1 ? 'end' : 'middle'}
          >
            {fmtDate(pts[i].date, { day: '2-digit', month: 'short' })}
          </text>
        ))}

        <path d={area} fill={`url(#g${gid})`} className="chart-fade" />
        {bench && <path d={bench} className="chart-bench chart-fade" />}
        <path d={main} className="chart-line chart-draw" style={{ '--len': len }} />

        {hp && (
          <g>
            <line className="chart-cross" x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} />
            {hasBench && Number.isFinite(hp.benchmark) && (
              <circle cx={x(hover)} cy={y(hp.benchmark)} r="3" fill="var(--muted)" />
            )}
            <circle className="chart-dot" cx={x(hover)} cy={y(hp.value)} r="4.5" />
          </g>
        )}
      </svg>

      {hp && (
        <div
          className="chart-tip"
          style={{ left: `${tipLeft}%`, transform: `translateX(${tipLeft > 60 ? 'calc(-100% - 12px)' : '12px'})` }}
          aria-live="polite"
        >
          <div className="t-date">{fmtDate(hp.date)}</div>
          <div className="t-row">
            <span><i className="legend-dot" style={{ background: 'var(--accent)', width: 8, height: 8, borderRadius: 2, display: 'inline-block' }} />{valueLabel}</span>
            <span className="num">{money(hp.value)}</span>
          </div>
          {hasBench && Number.isFinite(hp.benchmark) && (
            <div className="t-row">
              <span><i style={{ background: 'var(--muted)', width: 8, height: 8, borderRadius: 2, display: 'inline-block' }} />{benchLabel}</span>
              <span className="num">{money(hp.benchmark)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
