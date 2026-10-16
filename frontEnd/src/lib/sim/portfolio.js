// src/lib/sim/portfolio.js : spot portfolio (long only) with proportional fees.
// Invariant: equity = cash + qty * price, with cash >= 0 and qty >= 0.

const EPS = 1e-9;

export class Portfolio {
  constructor(capital, feeRate = 0.001) {
    this.capital = capital;
    this.feeRate = feeRate;
    this.cash = capital;
    this.qty = 0;
    this.costBasis = 0; // total paid for the current holding, buy fees included
    this.feesPaid = 0;
    this.realized = 0;
  }

  equity(price) {
    return this.cash + this.qty * price;
  }

  get avgCost() {
    return this.qty > EPS ? this.costBasis / this.qty : 0;
  }

  // Spend a fraction of the cash (fee included). Returns the fill or null.
  buy(price, fraction, minNotional = 10) {
    const budget = this.cash * Math.min(1, Math.max(0, fraction));
    const notional = budget / (1 + this.feeRate);
    if (notional < minNotional || price <= 0) return null;
    const fee = notional * this.feeRate;
    const qty = notional / price;
    this.cash = Math.max(0, this.cash - notional - fee);
    this.qty += qty;
    this.costBasis += notional + fee;
    this.feesPaid += fee;
    return { side: 'buy', price, qty, notional, fee, pnl: null };
  }

  // Sell a fraction of the holding. Returns the fill (with realised P&L) or null.
  sell(price, fraction, minNotional = 10) {
    const f = Math.min(1, Math.max(0, fraction));
    let qty = this.qty * f;
    if (qty * price < minNotional) {
      if (this.qty * price < minNotional) return null;
      qty = Math.min(this.qty, minNotional / price);
    }
    // close the position entirely when the remainder would be dust
    if ((this.qty - qty) * price < minNotional) qty = this.qty;
    const gross = qty * price;
    const fee = gross * this.feeRate;
    const basis = this.qty > EPS ? this.costBasis * (qty / this.qty) : 0;
    const pnl = gross - fee - basis;
    this.cash += gross - fee;
    this.qty = Math.max(0, this.qty - qty);
    this.costBasis = this.qty > EPS ? Math.max(0, this.costBasis - basis) : 0;
    if (this.qty <= EPS) this.qty = 0;
    this.feesPaid += fee;
    this.realized += pnl;
    return { side: 'sell', price, qty, notional: gross, fee, pnl, pnlPct: basis > 0 ? (pnl / basis) * 100 : 0 };
  }
}
