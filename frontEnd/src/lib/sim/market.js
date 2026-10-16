// src/lib/sim/market.js : synthetic crypto market.
// Geometric Brownian motion with volatility regimes (calm, trend, shock),
// aggregated into OHLCV candles. Everything is driven by a seeded RNG.

export const ASSETS = [
  // vol = hourly volatility of log returns, volume = typical units traded per hour
  { symbol: 'BTC', name: 'Bitcoin', price: 67400, vol: 0.0065, volume: 420, decimals: 0 },
  { symbol: 'ETH', name: 'Ethereum', price: 3240, vol: 0.0085, volume: 6800, decimals: 1 },
  { symbol: 'SOL', name: 'Solana', price: 152, vol: 0.012, volume: 92000, decimals: 2 },
  { symbol: 'ADA', name: 'Cardano', price: 0.462, vol: 0.011, volume: 9.5e6, decimals: 4 },
  { symbol: 'BNB', name: 'BNB', price: 584, vol: 0.0075, volume: 15500, decimals: 1 },
];

export const assetInfo = (symbol) => ASSETS.find((a) => a.symbol === symbol) || ASSETS[0];

export const INTERVALS = {
  '15m': 15 * 60000,
  '1h': 60 * 60000,
  '4h': 4 * 60 * 60000,
};

// Regime parameters, expressed relative to the asset hourly volatility.
export const REGIMES = {
  calm: { label: 'Calme', volMult: 0.55, driftMult: 0, min: 30, max: 90 },
  trend: { label: 'Tendance', volMult: 0.9, driftMult: 0.22, min: 20, max: 60 },
  shock: { label: 'Choc', volMult: 2.8, driftMult: 0.5, min: 5, max: 10 },
};

export class AssetStream {
  constructor(asset, rng, { ticksPerCandle = 12, intervalMs = INTERVALS['1h'], startTime = Date.UTC(2026, 0, 5) } = {}) {
    this.asset = asset;
    this.rng = rng;
    this.ticksPerCandle = ticksPerCandle;
    this.intervalMs = intervalMs;
    // the candle volatility scales with sqrt(interval) from the hourly figure
    this.sigmaCandle = asset.vol * Math.sqrt(intervalMs / INTERVALS['1h']);
    this.price = asset.price * Math.exp(rng.range(-0.04, 0.04));
    this.time = startTime;
    this.index = 0;
    this.tick = 0;
    this.pendingJump = 0;
    this.jumpTicks = 0;
    this.regime = { name: 'calm', left: rng.int(REGIMES.calm.min, REGIMES.calm.max), dir: 1 };
    this.forming = this._openCandle();
  }

  _openCandle() {
    return {
      i: this.index, t: this.time, o: this.price, h: this.price, l: this.price, c: this.price, v: 0, regime: this.regime.name,
    };
  }

  _nextRegime() {
    const r = this.rng.next();
    const from = this.regime.name;
    let name;
    if (from === 'shock') name = 'calm';
    else if (r < 0.04) name = 'shock';
    else name = from === 'calm' ? 'trend' : r < 0.55 ? 'calm' : 'trend';
    const p = REGIMES[name];
    const dir = this.rng.next() < 0.5 ? -1 : 1;
    this.regime = { name, left: this.rng.int(p.min, p.max), dir };
  }

  // Force a market shock: a sharp move spread over one candle, then a volatile regime.
  injectShock(direction = -1, size) {
    const mag = size ?? this.rng.range(0.06, 0.11);
    this.pendingJump = direction * mag;
    this.jumpTicks = this.ticksPerCandle;
    this.regime = { name: 'shock', left: this.rng.int(REGIMES.shock.min, REGIMES.shock.max), dir: direction };
    this.forming.regime = 'shock';
  }

  // One intra-candle tick. Returns the closed candle when this tick completes one.
  step() {
    const p = REGIMES[this.regime.name];
    const n = this.ticksPerCandle;
    const sigma = (this.sigmaCandle * p.volMult) / Math.sqrt(n);
    const drift = (this.regime.dir * p.driftMult * this.sigmaCandle) / n;
    let dlog = drift - 0.5 * sigma * sigma + sigma * this.rng.normal();
    if (this.jumpTicks > 0) {
      dlog += this.pendingJump / n;
      this.jumpTicks -= 1;
    }
    this.price *= Math.exp(dlog);

    const f = this.forming;
    f.c = this.price;
    if (this.price > f.h) f.h = this.price;
    if (this.price < f.l) f.l = this.price;
    // volume reacts to the size of the move and to the regime
    const z = Math.abs(dlog) / (sigma || 1e-9);
    const base = (this.asset.volume * (this.intervalMs / INTERVALS['1h'])) / n;
    f.v += base * (0.6 + 0.35 * z) * p.volMult ** 0.6 * Math.exp(0.35 * this.rng.normal());

    this.tick += 1;
    if (this.tick < n) return null;

    const closed = f;
    this.tick = 0;
    this.index += 1;
    this.time += this.intervalMs;
    this.regime.left -= 1;
    if (this.regime.left <= 0) this._nextRegime();
    this.forming = this._openCandle();
    return closed;
  }

  get progress() {
    return this.tick / this.ticksPerCandle;
  }
}
