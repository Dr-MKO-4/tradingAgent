// src/lib/sim/engine.js : live trading simulation run entirely in the browser.
// Several synthetic assets tick in parallel; the simulated DQN policy trades the
// selected one at every candle close, against a buy-and-hold benchmark.
import { makeRng, hashSeed } from './rng';
import { ASSETS, AssetStream, INTERVALS, assetInfo } from './market';
import { Indicators } from './indicators';
import { DqnPolicy, buildFeatures } from './agent';
import { Portfolio } from './portfolio';

const MAX_CANDLES = 400;
const MAX_EQUITY = 3000;
const MAX_ORDERS = 300;
const SHARPE_WINDOW = 100;

export const DEFAULTS = {
  asset: 'BTC',
  capital: 10000,
  seed: 42,
  feeRate: 0.001, // 0.1 %, as transaction_cost in agent/environments/crypto_env.py
  interval: '1h',
  ticksPerCandle: 12,
  warmup: 220,
  minNotional: 10,
};

export class LiveSim {
  constructor(options = {}) {
    this.opts = { ...DEFAULTS, ...options };
    const o = this.opts;
    this.seed = o.seed;
    const root = hashSeed(`mko-dqn-${o.seed}`);
    this.intervalMs = INTERVALS[o.interval] || INTERVALS['1h'];
    this.periodsPerYear = (365 * 24 * 3600000) / this.intervalMs;
    this.asset = assetInfo(o.asset);

    // one stream per asset, each with its own RNG derived from the seed
    this.streams = {};
    ASSETS.forEach((a, k) => {
      this.streams[a.symbol] = new AssetStream(a, makeRng(root + 7919 * (k + 1)), {
        ticksPerCandle: o.ticksPerCandle,
        intervalMs: this.intervalMs,
      });
    });
    this.rng = makeRng(root ^ 0x9e3779b9);
    this.policy = new DqnPolicy(makeRng(root + 104729));
    this.ind = new Indicators();
    this.portfolio = new Portfolio(o.capital, o.feeRate);

    this.candles = [];
    this.equity = [];
    this.orders = [];
    this.markers = [];
    this.totalOrders = 0;
    this.wins = 0;
    this.closed = 0;
    this.peak = o.capital;
    this.maxDrawdown = 0;
    this.decision = null;
    this.ticks = 0;
    this.version = 0;
    this.shocks = 0;
    this.openPrices = {};

    // Warm-up: history so that the indicators (SMA 50/200, MACD) are defined.
    for (let i = 0; i < o.warmup * o.ticksPerCandle; i++) this._tickStreams(false);
    ASSETS.forEach((a) => { this.openPrices[a.symbol] = this.streams[a.symbol].price; });
    const p0 = this.price;
    this.startTime = this.stream.time;
    this.startPrice = p0;
    // Buy & hold: everything invested at the first price, same fees.
    this.bhQty = o.capital / (p0 * (1 + o.feeRate));
    this.equity.push({ i: this.stream.index, t: this.stream.time, value: o.capital, benchmark: this.bhQty * p0 });
  }

  get stream() {
    return this.streams[this.asset.symbol];
  }

  get price() {
    return this.stream.price;
  }

  get forming() {
    return this.stream.forming;
  }

  _tickStreams(trade) {
    let closed = null;
    for (const a of ASSETS) {
      const c = this.streams[a.symbol].step();
      if (a.symbol === this.asset.symbol && c) closed = c;
    }
    if (closed) this._onCandle(closed, trade);
    return closed;
  }

  // Advance by one tick. Returns true when a candle closed.
  step() {
    this.ticks += 1;
    const closed = this._tickStreams(true);
    this.version += 1;
    return !!closed;
  }

  _onCandle(candle, trade) {
    this.candles.push(candle);
    if (this.candles.length > MAX_CANDLES) this.candles.shift();
    const ind = this.ind.push(candle.c);
    if (!trade || !ind.ready) return;

    const pf = this.portfolio;
    const price = candle.c;
    const eq = pf.equity(price);
    const features = buildFeatures(ind, { positionRatio: (pf.qty * price) / eq, cashRatio: pf.cash / eq });
    const d = this.policy.decide(features);
    let fill = null;
    if (d.name === 'buy') fill = pf.buy(price, d.size, this.opts.minNotional);
    else if (d.name === 'sell') fill = pf.sell(price, d.size, this.opts.minNotional);

    this.decision = { ...d, features, indicators: ind, t: candle.t, i: candle.i, price, executed: !!fill };

    if (fill) {
      this.totalOrders += 1;
      if (fill.side === 'sell') {
        this.closed += 1;
        if (fill.pnl > 0) this.wins += 1;
      }
      const order = {
        id: this.totalOrders, t: candle.t, i: candle.i, asset: this.asset.symbol, explore: d.explore, confidence: d.confidence, ...fill,
      };
      this.orders.push(order);
      if (this.orders.length > MAX_ORDERS) this.orders.shift();
      this.markers.push({ i: candle.i, side: fill.side, price });
      if (this.markers.length > MAX_ORDERS) this.markers.shift();
    }

    const value = pf.equity(price);
    this.equity.push({ i: candle.i, t: candle.t + this.intervalMs, value, benchmark: this.bhQty * price });
    if (this.equity.length > MAX_EQUITY) this.equity.splice(1, 1); // keep the starting point
    if (value > this.peak) this.peak = value;
    this.maxDrawdown = Math.max(this.maxDrawdown, (this.peak - value) / this.peak);
  }

  injectShock(direction) {
    const dir = direction || (this.rng.next() < 0.7 ? -1 : 1);
    this.stream.injectShock(dir, this.rng.range(0.06, 0.11));
    this.shocks += 1;
    this.version += 1;
    return dir;
  }

  rollingSharpe() {
    const e = this.equity;
    const n = Math.min(SHARPE_WINDOW, e.length - 1);
    if (n < 10) return null;
    const r = [];
    for (let k = e.length - n; k < e.length; k++) r.push(Math.log(e[k].value / e[k - 1].value));
    const mean = r.reduce((s, x) => s + x, 0) / n;
    const sd = Math.sqrt(r.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1));
    if (!(sd > 1e-12)) return 0;
    // Sharpe over the horizon of the window (return of the window / volatility of the window),
    // not annualised: annualising hourly returns of a mostly flat book gives meaningless values.
    return (mean / sd) * Math.sqrt(n);
  }

  metrics() {
    const pf = this.portfolio;
    const price = this.price;
    const value = pf.equity(price);
    const capital = this.opts.capital;
    const bench = this.bhQty * price;
    const unrealized = pf.qty * price - pf.costBasis;
    return {
      value,
      cash: pf.cash,
      qty: pf.qty,
      positionValue: pf.qty * price,
      exposure: value > 0 ? (pf.qty * price) / value : 0,
      avgCost: pf.avgCost,
      pnl: value - capital,
      ret: ((value - capital) / capital) * 100,
      benchmark: bench,
      benchRet: ((bench - capital) / capital) * 100,
      sharpe: this.rollingSharpe(),
      maxDrawdown: this.maxDrawdown * 100,
      winRate: this.closed ? (this.wins / this.closed) * 100 : null,
      trades: this.totalOrders,
      closedTrades: this.closed,
      fees: pf.feesPaid,
      realized: pf.realized,
      unrealized,
      candles: this.equity.length - 1,
      price,
      time: this.stream.time,
      regime: this.stream.regime.name,
      epsilon: this.policy.epsilon,
    };
  }

  watchlist() {
    return ASSETS.map((a) => {
      const s = this.streams[a.symbol];
      const open = this.openPrices[a.symbol];
      return { symbol: a.symbol, name: a.name, price: s.price, change: ((s.price - open) / open) * 100, regime: s.regime.name };
    });
  }

  // Shape compatible with the results payload of the backend (/api/simulation/results).
  toResults() {
    const m = this.metrics();
    return {
      portfolio: this.equity.map((p) => ({ date: new Date(p.t).toISOString(), value: p.value, benchmark: p.benchmark })),
      metrics: { sharpe: m.sharpe, drawdown: m.maxDrawdown },
      tradingSignals: this.orders.slice(-30).reverse().map((o) => ({
        action: o.side,
        gain: o.side === 'sell' ? o.pnlPct : 0,
        gainMessage: `${o.asset} · ${o.qty.toPrecision(4)} @ ${o.price.toFixed(this.asset.decimals)}`,
      })),
    };
  }
}
