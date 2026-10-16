// src/lib/demo.js
// Demonstration data only. These figures are generated, deterministic and
// do NOT represent real trading performance. Every screen using them shows a "Démo" label.

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function walk(n, start, endRatio, vol, seed) {
  const r = rng(seed);
  const w = [0];
  for (let i = 1; i < n; i++) w.push(w[i - 1] + (r() - 0.5) * vol);
  const target = Math.log(endRatio);
  const end = w[n - 1];
  return w.map((x, i) => start * Math.exp(x - (end * i) / (n - 1) + (target * i) / (n - 1)));
}

const DAYS = 180;
const START = Date.UTC(2025, 0, 6);

function build() {
  const agent = walk(DAYS, 12000, 1.185, 0.022, 7);
  const bench = walk(DAYS, 12000, 1.092, 0.036, 21);
  return agent.map((v, i) => ({
    date: new Date(START + i * 86400000).toISOString(),
    value: Math.round(v * 100) / 100,
    benchmark: Math.round(bench[i] * 100) / 100,
  }));
}

export const DEMO_EQUITY = build();

// Values historically shown on the home page, kept as demo values.
export const DEMO_PORTFOLIO = {
  invested: 12000,
  returnPct: 18.5,
  value: 12000 * 1.185,
  cash: 7500,
};

export const DEMO_AGENT = {
  name: 'DQN',
  asset: 'BTC',
  episodes: 500,
  epsilon: 0.05,
  gamma: 0.95,
  lr: 0.001,
  winRate: 56.4,
  trades: 142,
};

export const DEMO_WATCHLIST = [
  { symbol: 'BTC', name: 'Bitcoin', price: 64120, change: 2.4 },
  { symbol: 'ETH', name: 'Ethereum', price: 3015, change: -5.0 },
  { symbol: 'ADA', name: 'Cardano', price: 0.47, change: 12.0 },
  { symbol: 'SOL', name: 'Solana', price: 148.3, change: 0.0 },
];

const t0 = START + (DAYS - 1) * 86400000;
const h = 3600000;
export const DEMO_DECISIONS = [
  { t: t0 + 20 * h, asset: 'BTC', action: 'buy', price: 64120, qty: 0.042, q: 0.81 },
  { t: t0 + 16 * h, asset: 'ETH', action: 'hold', price: 3015, qty: 0, q: 0.12 },
  { t: t0 + 12 * h, asset: 'BTC', action: 'sell', price: 63480, qty: 0.035, q: 0.64 },
  { t: t0 + 8 * h, asset: 'ETH', action: 'buy', price: 2988, qty: 0.6, q: 0.57 },
  { t: t0 + 4 * h, asset: 'BTC', action: 'hold', price: 62950, qty: 0, q: 0.09 },
  { t: t0, asset: 'BTC', action: 'buy', price: 62710, qty: 0.05, q: 0.73 },
].map((d) => ({ ...d, date: new Date(d.t).toISOString() }));
