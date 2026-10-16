// src/components/Live/useLiveCanvas.js : canvas bound to the live loop.
// Handles device pixel ratio, resizing and theme colours; the draw function
// is called from the requestAnimationFrame loop, never through React state.
import { useEffect, useRef } from 'react';
import { useLiveSim } from '../../contexts/LiveSimContext';

const VARS = ['bg', 'surface', 'surface-2', 'border', 'border-strong', 'text', 'text-2', 'muted', 'accent', 'accent-soft', 'up', 'up-soft', 'down', 'down-soft', 'grid', 'neutral-soft'];

function readColors() {
  const cs = getComputedStyle(document.documentElement);
  const out = {};
  VARS.forEach((v) => { out[v] = cs.getPropertyValue(`--${v}`).trim(); });
  out.mono = `"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace`;
  out.sans = `Inter, ui-sans-serif, system-ui, sans-serif`;
  return out;
}

export default function useLiveCanvas(draw) {
  const canvasRef = useRef(null);
  const live = useLiveSim();
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const state = { w: 0, h: 0, dpr: 1, colors: readColors(), dirty: true, version: -1, progress: -1, mem: {} };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      state.w = Math.max(1, Math.round(r.width));
      state.h = Math.max(1, Math.round(r.height));
      state.dpr = dpr;
      canvas.width = Math.round(state.w * dpr);
      canvas.height = Math.round(state.h * dpr);
      state.dirty = true;
    };
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);
    const mo = new MutationObserver(() => { state.colors = readColors(); state.dirty = true; });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    // fonts loaded later change text metrics
    document.fonts?.ready?.then(() => { state.dirty = true; });

    const off = live.onFrame((sim, progress) => {
      if (!sim) return;
      const p = Math.round(progress * 100) / 100;
      if (!state.dirty && sim.version === state.version && p === state.progress && !state.animating) return;
      state.version = sim.version;
      state.progress = p;
      state.dirty = false;
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      ctx.clearRect(0, 0, state.w, state.h);
      drawRef.current(ctx, sim, { ...state, progress, live }, state);
    });
    return () => { off(); ro?.disconnect(); mo.disconnect(); };
  }, [live]);

  return canvasRef;
}

export function niceStep(span, count) {
  const raw = span / Math.max(1, count);
  const pow = 10 ** Math.floor(Math.log10(raw || 1));
  return [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) || raw;
}

export function fmtPrice(v, decimals) {
  return v.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
