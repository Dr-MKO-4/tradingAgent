// src/components/Live/CandleChart.jsx : live candlestick chart (canvas).
// 60 to 120 candles visible depending on the width, smooth scrolling while the
// current candle forms, EMA 12 / SMA 50 overlays, volume, buy and sell markers.
import React from 'react';
import useLiveCanvas, { niceStep, fmtPrice } from './useLiveCanvas';

function overlays(candles) {
  const ema = [];
  const sma = [];
  let e = null;
  let sum = 0;
  candles.forEach((c, k) => {
    e = e == null ? c.c : c.c * (2 / 13) + e * (11 / 13);
    ema.push(e);
    sum += c.c;
    if (k >= 50) sum -= candles[k - 50].c;
    sma.push(k >= 49 ? sum / 50 : null);
  });
  return { ema, sma };
}

function drawCandles(ctx, sim, opt, state) {
  const { w, h, colors: C, progress } = opt;
  const compact = opt.compact;
  const dec = sim.asset.decimals;
  const axisW = compact ? 58 : 70;
  const pad = { t: 10, b: compact ? 8 : 22, l: 0 };
  const plotR = w - axisW;
  const plotH = h - pad.t - pad.b;
  const volH = plotH * 0.16;
  const priceH = plotH - volH - 6;

  const visible = Math.max(60, Math.min(120, Math.floor(plotR / (compact ? 6 : 8))));
  const all = sim.candles;
  const forming = sim.forming;
  const series = all.slice(-(visible + 51));
  const { ema, sma } = overlays([...series, forming]);
  const off = series.length + 1 - (visible + 1);
  const view = [...series, forming].slice(Math.max(0, off));
  const emaV = ema.slice(Math.max(0, off));
  const smaV = sma.slice(Math.max(0, off));
  const cw = plotR / visible;
  const last = view.length - 1;
  const p = Math.max(0, Math.min(1, progress));
  const cx = (k) => plotR - cw / 2 - (last - k) * cw + (1 - p) * cw;

  // target y range, eased between frames to avoid jitter
  let lo = Infinity;
  let hi = -Infinity;
  let vmax = 0;
  view.forEach((c) => { if (c.l < lo) lo = c.l; if (c.h > hi) hi = c.h; if (c.v > vmax) vmax = c.v; });
  const padY = (hi - lo) * 0.1 || hi * 0.01;
  lo -= padY; hi += padY;
  const m = state.mem;
  if (m.lo == null || opt.live.reduced || m.asset !== sim.asset.symbol || m.seed !== sim.seed) { m.lo = lo; m.hi = hi; }
  else { m.lo += (lo - m.lo) * 0.18; m.hi += (hi - m.hi) * 0.18; }
  m.asset = sim.asset.symbol; m.seed = sim.seed;
  state.animating = Math.abs(m.lo - lo) > (hi - lo) * 0.002 || Math.abs(m.hi - hi) > (hi - lo) * 0.002;
  const yLo = Math.min(m.lo, lo + padY * 0.5);
  const yHi = Math.max(m.hi, hi - padY * 0.5);
  const y = (v) => pad.t + (1 - (v - yLo) / (yHi - yLo || 1)) * priceH;
  const volTop = pad.t + priceH + 6;

  // grid + price axis
  ctx.font = `${compact ? 10 : 11}px ${C.mono}`;
  ctx.textBaseline = 'middle';
  const step = niceStep(yHi - yLo, compact ? 3 : 5);
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'left';
  for (let v = Math.ceil(yLo / step) * step; v <= yHi; v += step) {
    const yy = Math.round(y(v)) + 0.5;
    ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(plotR, yy); ctx.stroke();
    ctx.fillText(fmtPrice(v, step < 1 ? dec : Math.min(dec, step < 10 ? 1 : 0)), plotR + 8, yy);
  }

  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, plotR, h); ctx.clip();

  // shock regimes
  ctx.fillStyle = C['accent-soft'];
  view.forEach((c, k) => {
    if (c.regime === 'shock') ctx.fillRect(cx(k) - cw / 2, pad.t, cw + 0.5, priceH);
  });

  // volume
  const bw = Math.max(1, cw * 0.62);
  view.forEach((c, k) => {
    const vh = vmax ? (c.v / vmax) * volH : 0;
    ctx.fillStyle = c.c >= c.o ? C['up-soft'] : C['down-soft'];
    ctx.fillRect(cx(k) - bw / 2, volTop + volH - vh, bw, vh);
  });

  // overlays
  const line = (vals, color, dash) => {
    ctx.beginPath();
    let started = false;
    vals.forEach((v, k) => {
      if (v == null) return;
      if (!started) { ctx.moveTo(cx(k), y(v)); started = true; } else ctx.lineTo(cx(k), y(v));
    });
    ctx.strokeStyle = color; ctx.lineWidth = 1.3; ctx.setLineDash(dash || []); ctx.globalAlpha = 0.85;
    ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  };
  line(smaV, C.muted, [4, 4]);
  line(emaV, C.accent);

  // candles
  view.forEach((c, k) => {
    const up = c.c >= c.o;
    const col = up ? C.up : C.down;
    const x = Math.round(cx(k)) + 0.5;
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y(c.h)); ctx.lineTo(x, y(c.l)); ctx.stroke();
    const top = y(Math.max(c.o, c.c));
    const bh = Math.max(1, y(Math.min(c.o, c.c)) - top);
    ctx.fillRect(x - bw / 2, top, bw, bh);
  });

  // trade markers
  const firstI = view[0]?.i ?? 0;
  const size = Math.max(4, Math.min(7, cw * 0.55));
  sim.markers.forEach((mk) => {
    const k = mk.i - firstI;
    if (k < 0 || k > last) return;
    const c = view[k];
    const x = cx(k);
    ctx.beginPath();
    if (mk.side === 'buy') {
      const yy = y(c.l) + 6;
      ctx.moveTo(x, yy); ctx.lineTo(x - size, yy + size * 1.5); ctx.lineTo(x + size, yy + size * 1.5);
      ctx.fillStyle = C.up;
    } else {
      const yy = y(c.h) - 6;
      ctx.moveTo(x, yy); ctx.lineTo(x - size, yy - size * 1.5); ctx.lineTo(x + size, yy - size * 1.5);
      ctx.fillStyle = C.down;
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.surface; ctx.lineWidth = 1; ctx.stroke();
  });
  ctx.restore();

  // last price line + tag
  const lp = forming.c;
  const ly = Math.round(y(lp)) + 0.5;
  const up = lp >= forming.o;
  ctx.strokeStyle = up ? C.up : C.down;
  ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(plotR, ly); ctx.stroke();
  ctx.setLineDash([]);
  const tag = fmtPrice(lp, dec);
  ctx.font = `600 ${compact ? 10 : 11}px ${C.mono}`;
  const tw = ctx.measureText(tag).width + 10;
  ctx.fillStyle = up ? C.up : C.down;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(plotR + 2, ly - 9, Math.min(tw, axisW - 4), 18, 4); else ctx.rect(plotR + 2, ly - 9, Math.min(tw, axisW - 4), 18);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillText(tag, plotR + 7, ly + 0.5);

  // time axis
  if (!compact) {
    ctx.font = `10.5px ${C.mono}`;
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const every = Math.ceil(visible / Math.max(2, Math.floor(plotR / 110)));
    view.forEach((c, k) => {
      if (c.i % every !== 0) return;
      const x = cx(k);
      if (x < 24 || x > plotR - 24) return;
      const d = new Date(c.t);
      ctx.fillText(`${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}h`, x, h - 6);
    });
  }
}

export default function CandleChart({ height = 380, compact = false, label }) {
  const ref = useLiveCanvas((ctx, sim, opt, state) => drawCandles(ctx, sim, { ...opt, compact }, state));
  return (
    <div className="live-canvas" style={{ height }}>
      <canvas
        ref={ref}
        role="img"
        aria-label={label || 'Graphique en chandeliers en temps réel avec les ordres d’achat (triangles verts) et de vente (triangles rouges) de l’agent'}
      />
    </div>
  );
}
