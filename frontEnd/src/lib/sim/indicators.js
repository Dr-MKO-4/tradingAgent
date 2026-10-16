// src/lib/sim/indicators.js : incremental technical indicators, the same family as
// agent/indicators.py (RSI 14, SMA 50/200, EMA 12/26, MACD 12/26/9), plus SMA 20 and
// a rolling volatility used to normalise the features.

export class Indicators {
  constructor() {
    this.closes = [];
    this.rets = [];
    this.avgGain = null;
    this.avgLoss = null;
    this.gainSeed = [];
    this.ema12 = null;
    this.ema26 = null;
    this.signal = null;
    this.macdSeed = [];
    this.last = null;
  }

  static ema(prev, value, period) {
    if (prev == null) return value;
    const k = 2 / (period + 1);
    return value * k + prev * (1 - k);
  }

  sma(period) {
    const c = this.closes;
    if (c.length < period) return null;
    let s = 0;
    for (let i = c.length - period; i < c.length; i++) s += c[i];
    return s / period;
  }

  push(close) {
    const c = this.closes;
    const prev = c.length ? c[c.length - 1] : null;
    c.push(close);
    if (c.length > 260) c.shift();

    if (prev != null) {
      const r = Math.log(close / prev);
      this.rets.push(r);
      if (this.rets.length > 60) this.rets.shift();
      // Wilder RSI 14
      const gain = Math.max(0, close - prev);
      const loss = Math.max(0, prev - close);
      if (this.avgGain == null) {
        this.gainSeed.push([gain, loss]);
        if (this.gainSeed.length === 14) {
          this.avgGain = this.gainSeed.reduce((s, g) => s + g[0], 0) / 14;
          this.avgLoss = this.gainSeed.reduce((s, g) => s + g[1], 0) / 14;
        }
      } else {
        this.avgGain = (this.avgGain * 13 + gain) / 14;
        this.avgLoss = (this.avgLoss * 13 + loss) / 14;
      }
    }

    this.ema12 = Indicators.ema(this.ema12, close, 12);
    this.ema26 = Indicators.ema(this.ema26, close, 26);
    const macd = this.ema12 - this.ema26;
    this.signal = Indicators.ema(this.signal, macd, 9);

    const rets = this.rets;
    const recent = rets.slice(-20);
    const mean = recent.reduce((s, x) => s + x, 0) / (recent.length || 1);
    const vol = Math.sqrt(recent.reduce((s, x) => s + (x - mean) ** 2, 0) / Math.max(1, recent.length - 1)) || 0.005;
    let rsi = 50;
    if (this.avgGain != null) {
      rsi = this.avgLoss === 0 ? 100 : 100 - 100 / (1 + this.avgGain / this.avgLoss);
    }

    this.last = {
      close,
      ret1: rets.length ? rets[rets.length - 1] : 0,
      ret5: rets.slice(-5).reduce((s, x) => s + x, 0),
      rsi,
      sma20: this.sma(20) ?? close,
      sma50: this.sma(50) ?? close,
      sma200: this.sma(200),
      ema12: this.ema12,
      ema26: this.ema26,
      macd,
      signal: this.signal,
      hist: macd - this.signal,
      vol,
      ready: c.length >= 50,
    };
    return this.last;
  }
}
