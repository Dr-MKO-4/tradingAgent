import { describe, it, expect } from 'vitest';
import { LiveSim } from './engine';
import { Portfolio } from './portfolio';
import { qValues, softmax, buildFeatures } from './agent';
import { makeRng } from './rng';
import { ASSETS } from './market';

const run = (sim, ticks) => { for (let i = 0; i < ticks; i++) sim.step(); return sim; };

describe('reproductibilité', () => {
  it('même graine, même trajectoire et mêmes ordres', () => {
    const a = run(new LiveSim({ seed: 1234 }), 3000);
    const b = run(new LiveSim({ seed: 1234 }), 3000);
    expect(a.candles.map((c) => c.c)).toEqual(b.candles.map((c) => c.c));
    expect(a.orders).toEqual(b.orders);
    expect(a.metrics()).toEqual(b.metrics());
  });

  it('graines différentes, trajectoires différentes', () => {
    const a = run(new LiveSim({ seed: 1 }), 600);
    const b = run(new LiveSim({ seed: 2 }), 600);
    expect(a.price).not.toEqual(b.price);
  });

  it('rng : uniformes dans [0, 1[ et normales centrées', () => {
    const r = makeRng(7);
    let s = 0; let s2 = 0;
    for (let i = 0; i < 20000; i++) {
      const u = r.next();
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThan(1);
      const z = r.normal(); s += z; s2 += z * z;
    }
    expect(Math.abs(s / 20000)).toBeLessThan(0.05);
    expect(Math.abs(s2 / 20000 - 1)).toBeLessThan(0.05);
  });
});

describe('marché', () => {
  it('bougies OHLC cohérentes et prix réalistes pour chaque actif', () => {
    for (const a of ASSETS) {
      const sim = run(new LiveSim({ seed: 9, asset: a.symbol }), 1200);
      for (const c of sim.candles) {
        expect(c.h).toBeGreaterThanOrEqual(Math.max(c.o, c.c) - 1e-9);
        expect(c.l).toBeLessThanOrEqual(Math.min(c.o, c.c) + 1e-9);
        expect(c.v).toBeGreaterThan(0);
      }
      expect(sim.price / a.price).toBeGreaterThan(0.3);
      expect(sim.price / a.price).toBeLessThan(3);
    }
  });

  it('un choc de marché provoque un mouvement brusque', () => {
    const sim = run(new LiveSim({ seed: 5 }), 120);
    const before = sim.price;
    sim.injectShock(-1);
    run(sim, sim.opts.ticksPerCandle);
    expect(sim.price / before).toBeLessThan(0.97);
  });
});

describe('portefeuille', () => {
  it('invariants : équité = cash + qté × prix, jamais de position ni de cash négatifs', () => {
    for (const seed of [3, 17, 99, 2024]) {
      const sim = new LiveSim({ seed, capital: 5000 });
      for (let i = 0; i < 6000; i++) {
        sim.step();
        if (i === 2000) sim.injectShock(-1);
        if (i === 4000) sim.injectShock(1);
        const pf = sim.portfolio;
        expect(pf.qty).toBeGreaterThanOrEqual(0);
        expect(pf.cash).toBeGreaterThanOrEqual(-1e-9);
        const m = sim.metrics();
        expect(m.value).toBeCloseTo(pf.cash + pf.qty * sim.price, 6);
      }
      for (const p of sim.equity) expect(Number.isFinite(p.value)).toBe(true);
      expect(sim.metrics().trades).toBeGreaterThan(0);
    }
  });

  it('frais appliqués à l\'achat et à la vente', () => {
    const pf = new Portfolio(10000, 0.001);
    const buy = pf.buy(100, 1);
    expect(buy.fee).toBeCloseTo(buy.notional * 0.001, 9);
    expect(buy.notional + buy.fee).toBeCloseTo(10000, 6);
    expect(pf.cash).toBeCloseTo(0, 6);
    const sell = pf.sell(100, 1);
    expect(sell.fee).toBeCloseTo(sell.notional * 0.001, 9);
    // aller-retour au même prix : on perd exactement les deux frais
    expect(pf.cash).toBeCloseTo(10000 - buy.fee - sell.fee, 6);
    expect(sell.pnl).toBeCloseTo(-(buy.fee + sell.fee), 6);
    expect(pf.feesPaid).toBeCloseTo(buy.fee + sell.fee, 9);
    expect(pf.qty).toBe(0);
  });

  it('sans frais, aller-retour neutre ; vente partielle au prorata', () => {
    const pf = new Portfolio(1000, 0);
    pf.buy(50, 1);
    const s = pf.sell(60, 0.5);
    expect(s.pnl).toBeCloseTo(100, 6);
    expect(pf.qty).toBeCloseTo(10, 6);
    expect(pf.equity(60)).toBeCloseTo(1200, 6);
  });

  it('pas de vente sans position, pas d\'achat sans cash', () => {
    const pf = new Portfolio(1000, 0.001);
    expect(pf.sell(100, 1)).toBeNull();
    pf.buy(100, 1);
    expect(pf.buy(100, 1)).toBeNull();
  });
});

describe('agent', () => {
  it('Q dueling : moyenne des avantages centrée sur V', () => {
    const f = buildFeatures({ close: 100, ret1: 0.01, ret5: 0.02, rsi: 62, sma20: 98, sma50: 95, ema12: 101, ema26: 99, hist: 0.3, vol: 0.006 }, { positionRatio: 0, cashRatio: 1 });
    const { q, value } = qValues(f);
    expect(q).toHaveLength(3);
    expect(q.reduce((s, x) => s + x, 0) / 3).toBeCloseTo(value, 9);
    const p = softmax(q, 0.12);
    expect(p.reduce((s, x) => s + x, 0)).toBeCloseTo(1, 9);
  });

  it('epsilon décroît jusqu\'au plancher', () => {
    const sim = run(new LiveSim({ seed: 11 }), 12 * 600);
    expect(sim.policy.epsilon).toBeCloseTo(0.02, 6);
  });
});
