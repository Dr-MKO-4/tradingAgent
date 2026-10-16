// src/contexts/LiveSimContext.jsx : runs the in-browser live simulation.
// A single requestAnimationFrame loop advances the engine with a fixed time step.
// Canvas charts subscribe to every frame (no React render); React panels read a
// throttled snapshot through useSyncExternalStore.
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore,
} from 'react';
import { LiveSim } from '../lib/sim/engine';
import { randomSeed } from '../lib/sim/rng';
import { saveSession } from '../lib/sim/history';

const LiveSimContext = createContext(null);
export const useLiveSim = () => useContext(LiveSimContext);

export const SPEEDS = [1, 5, 20];
const BASE_TICKS_PER_SEC = 4; // x1: one candle (12 ticks) every 3 s
const SNAPSHOT_MS = 150;
const SAVE_EVERY = 20; // candles

const reducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

function sessionRecord(sim, id, startedAt) {
  const m = sim.metrics();
  return {
    id,
    date: startedAt,
    crypto: sim.asset.symbol,
    agent: 'DQN · politique simulée',
    return: m.ret,
    benchReturn: m.benchRet,
    finalValue: m.value,
    capital: sim.opts.capital,
    candles: m.candles,
    trades: m.trades,
    winRate: m.winRate,
    sharpe: m.sharpe,
    maxDrawdown: m.maxDrawdown,
    seed: sim.seed,
    live: true,
    status: 'done',
  };
}

export function LiveSimProvider({ children }) {
  const [config, setConfig] = useState(() => ({ asset: 'BTC', capital: 10000, seed: 42, randomSeed: false }));
  const simRef = useRef(null);
  const meta = useRef({ id: null, startedAt: null, lastSaved: 0 });
  const frameSubs = useRef(new Set());
  const snapSubs = useRef(new Set());
  const snapRef = useRef({ v: 0 });
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeedState] = useState(() => (reducedMotion() ? 1 : 5));
  const [views, setViews] = useState(0);
  const reduced = useMemo(reducedMotion, []);
  const playRef = useRef(playing);
  const speedRef = useRef(speed);
  playRef.current = playing;
  speedRef.current = speed;

  const persist = useCallback(() => {
    const sim = simRef.current;
    if (!sim || sim.equity.length < 3) return;
    saveSession(sessionRecord(sim, meta.current.id, meta.current.startedAt));
    meta.current.lastSaved = sim.equity.length;
  }, []);

  const emitSnapshot = useCallback(() => {
    snapRef.current = { v: snapRef.current.v + 1 };
    snapSubs.current.forEach((f) => f());
  }, []);

  const create = useCallback((cfg) => {
    if (simRef.current) persist();
    const seed = cfg.randomSeed ? randomSeed() : Number(cfg.seed) || 0;
    simRef.current = new LiveSim({ asset: cfg.asset, capital: Math.max(100, Number(cfg.capital) || 10000), seed });
    meta.current = { id: `L${Date.now().toString(36).toUpperCase()}`, startedAt: new Date().toISOString(), lastSaved: 0 };
    frameSubs.current.forEach((f) => f(simRef.current, 0));
    emitSnapshot();
    return seed;
  }, [persist, emitSnapshot]);

  if (!simRef.current) {
    simRef.current = new LiveSim({ asset: config.asset, capital: config.capital, seed: config.seed });
    meta.current = { id: `L${Date.now().toString(36).toUpperCase()}`, startedAt: new Date().toISOString(), lastSaved: 0 };
  }

  // Main loop: fixed step, runs only while a live view is mounted and playing.
  useEffect(() => {
    if (!views) return undefined;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let lastSnap = 0;
    const loop = (now) => {
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      const sim = simRef.current;
      let stepped = 0;
      if (playRef.current) {
        const rate = BASE_TICKS_PER_SEC * speedRef.current * (reduced ? 0.5 : 1);
        acc += dt * rate;
        const n = Math.min(Math.floor(acc), 400);
        acc -= n;
        for (let k = 0; k < n; k++) sim.step();
        stepped = n;
        if (sim.equity.length - meta.current.lastSaved >= SAVE_EVERY) persist();
      }
      const progress = playRef.current && !reduced ? Math.min(1, sim.stream.progress + acc / sim.opts.ticksPerCandle) : sim.stream.progress;
      frameSubs.current.forEach((f) => f(sim, progress, stepped));
      if (stepped && now - lastSnap > SNAPSHOT_MS) {
        lastSnap = now;
        emitSnapshot();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [views, reduced, persist, emitSnapshot]);

  useEffect(() => {
    const onHide = () => persist();
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, [persist]);

  const attach = useCallback(() => {
    setViews((v) => v + 1);
    return () => setViews((v) => v - 1);
  }, []);
  const onFrame = useCallback((fn) => {
    frameSubs.current.add(fn);
    fn(simRef.current, simRef.current.stream.progress, 0);
    return () => frameSubs.current.delete(fn);
  }, []);
  const subscribe = useCallback((fn) => {
    snapSubs.current.add(fn);
    return () => snapSubs.current.delete(fn);
  }, []);
  const getVersion = useCallback(() => snapRef.current, []);

  const api = useMemo(() => ({
    get sim() { return simRef.current; },
    config,
    playing,
    speed,
    reduced,
    sessionId: () => meta.current.id,
    play: () => setPlaying(true),
    pause: () => { setPlaying(false); persist(); },
    toggle: () => setPlaying((p) => { if (p) persist(); return !p; }),
    setSpeed: (s) => setSpeedState(s),
    reset: (patch = {}) => {
      const next = { ...config, ...patch };
      const seed = create(next);
      setConfig({ ...next, seed, randomSeed: false });
    },
    shock: (dir) => {
      const d = simRef.current.injectShock(dir);
      emitSnapshot();
      return d;
    },
    attach,
    onFrame,
    subscribe,
    getVersion,
    persist,
  }), [config, playing, speed, reduced, create, persist, emitSnapshot, attach, onFrame, subscribe, getVersion]);

  return <LiveSimContext.Provider value={api}>{children}</LiveSimContext.Provider>;
}

// Mount a live view: starts the loop while the component is on screen.
export function useLiveView() {
  const live = useLiveSim();
  const { attach } = live;
  useEffect(() => attach(), [attach]);
  return live;
}

// Throttled snapshot (about 7 renders per second at most).
export function useLiveSnapshot() {
  const live = useLiveSim();
  useSyncExternalStore(live.subscribe, live.getVersion);
  return live.sim;
}
