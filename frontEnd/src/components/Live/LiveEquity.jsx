// src/components/Live/LiveEquity.jsx : live equity curve of the agent vs buy & hold (canvas).
import React from 'react';
import useLiveCanvas, { niceStep } from './useLiveCanvas';

function compact(v) {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k`;
  return v.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
}

function drawEquity(ctx, sim, opt) {
  const { w, h, colors: C } = opt;
  const pts = sim.equity;
  const axisW = 52;
  const pad = { t: 10, b: 10 };
  const plotR = w - axisW;
  const ih = h - pad.t - pad.b;
  if (pts.length < 2) {
    ctx.fillStyle = C.muted;
    ctx.font = `12px ${C.sans}`;
    ctx.textAlign = 'center';
    ctx.fillText('En attente des premières décisions…', w / 2, h / 2);
    return;
  }
  // downsample to the pixel width
  const n = pts.length;
  const stride = Math.max(1, Math.floor(n / plotR));
  const s = [];
  for (let k = 0; k < n; k += stride) s.push(pts[k]);
  if (s[s.length - 1] !== pts[n - 1]) s.push(pts[n - 1]);

  let lo = Infinity;
  let hi = -Infinity;
  s.forEach((p) => {
    lo = Math.min(lo, p.value, p.benchmark);
    hi = Math.max(hi, p.value, p.benchmark);
  });
  const span = hi - lo || hi * 0.01 || 1;
  lo -= span * 0.08; hi += span * 0.08;
  const x = (k) => (k / (s.length - 1)) * plotR;
  const y = (v) => pad.t + (1 - (v - lo) / (hi - lo)) * ih;

  ctx.font = `10.5px ${C.mono}`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = C.muted;
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  const step = niceStep(hi - lo, 4);
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) {
    const yy = Math.round(y(v)) + 0.5;
    ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(plotR, yy); ctx.stroke();
    ctx.fillText(compact(v), plotR + 6, yy);
  }
  // starting capital reference
  const cap = sim.opts.capital;
  if (cap > lo && cap < hi) {
    ctx.strokeStyle = C['border-strong'];
    ctx.setLineDash([1, 3]);
    ctx.beginPath(); ctx.moveTo(0, y(cap)); ctx.lineTo(plotR, y(cap)); ctx.stroke();
    ctx.setLineDash([]);
  }

  // benchmark
  ctx.beginPath();
  s.forEach((p, k) => (k ? ctx.lineTo(x(k), y(p.benchmark)) : ctx.moveTo(x(k), y(p.benchmark))));
  ctx.strokeStyle = C.muted; ctx.lineWidth = 1.3; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);

  // agent (area + line)
  const g = ctx.createLinearGradient(0, pad.t, 0, pad.t + ih);
  g.addColorStop(0, C['accent-soft']);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  s.forEach((p, k) => (k ? ctx.lineTo(x(k), y(p.value)) : ctx.moveTo(x(k), y(p.value))));
  ctx.lineTo(x(s.length - 1), pad.t + ih); ctx.lineTo(0, pad.t + ih); ctx.closePath();
  ctx.fillStyle = g; ctx.fill();
  ctx.beginPath();
  s.forEach((p, k) => (k ? ctx.lineTo(x(k), y(p.value)) : ctx.moveTo(x(k), y(p.value))));
  ctx.strokeStyle = C.accent; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
  const lp = s[s.length - 1];
  ctx.beginPath(); ctx.arc(x(s.length - 1), y(lp.value), 3.5, 0, Math.PI * 2);
  ctx.fillStyle = C.surface; ctx.fill(); ctx.strokeStyle = C.accent; ctx.lineWidth = 2; ctx.stroke();
}

export default function LiveEquity({ height = 240 }) {
  const ref = useLiveCanvas(drawEquity);
  return (
    <div className="live-canvas" style={{ height }}>
      <canvas ref={ref} role="img" aria-label="Courbe d'équité en direct de l'agent (ligne pleine) comparée à acheter et conserver (pointillés)" />
    </div>
  );
}
