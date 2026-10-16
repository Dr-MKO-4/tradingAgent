// src/lib/sim/agent.js : simulated DQN policy.
// Pedagogical reproduction of the decision logic of agent/agents/dqn_agent.py:
// a Dueling Q network Q(s,a) = V(s) + A(s,a) - mean_a A(s,a) evaluated on normalised
// features, an epsilon-greedy choice among the actions 0 = hold, 1 = buy, 2 = sell,
// and a position size derived from the confidence of the greedy action.
// The weights are fixed by hand (policy-weights.json): this is NOT the trained model.
import WEIGHTS from './policy-weights.json';

export const ACTIONS = ['hold', 'buy', 'sell'];

const relu = (x) => (x > 0 ? x : 0);

function linear(W, b, x) {
  if (W === 'identity') return x.map((v, i) => v + (b?.[i] || 0));
  return W.map((row, i) => row.reduce((s, w, j) => s + w * x[j], b?.[i] || 0));
}

// Features: returns, RSI, SMA/EMA gaps, MACD, position, cash, all scaled to about [-1, 1].
export function buildFeatures(ind, { positionRatio, cashRatio }) {
  const v = ind.vol || 0.005;
  const c = ind.close;
  return [
    Math.tanh(ind.ret1 / (v * 1.5)),
    Math.tanh(ind.ret5 / (v * 3)),
    (ind.rsi - 50) / 50,
    Math.tanh((c / ind.sma20 - 1) / (v * 3)),
    Math.tanh((c / ind.sma50 - 1) / (v * 5)),
    Math.tanh(((ind.ema12 - ind.ema26) / c) / (v * 1.5)),
    Math.tanh((ind.hist / c) / (v * 0.5)),
    Math.min(1, Math.max(0, positionRatio)),
    Math.min(1, Math.max(0, cashRatio)),
  ];
}

export function qValues(features, w = WEIGHTS) {
  const h = linear(w.feature.W, w.feature.b, features).map(relu);
  const hv = linear(w.value.W1, w.value.b1, h).map(relu);
  const ha = linear(w.advantage.W1, w.advantage.b1, h).map(relu);
  const value = linear(w.value.W2, w.value.b2, hv)[0];
  const adv = linear(w.advantage.W2, w.advantage.b2, ha);
  const mean = adv.reduce((s, a) => s + a, 0) / adv.length;
  return { q: adv.map((a) => value + a - mean), value, adv, hidden: h };
}

export function softmax(q, temperature) {
  const m = Math.max(...q);
  const e = q.map((x) => Math.exp((x - m) / temperature));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((x) => x / s);
}

export class DqnPolicy {
  constructor(rng, weights = WEIGHTS) {
    this.rng = rng;
    this.w = weights;
    this.epsilon = weights.epsilon.start;
  }

  decide(features) {
    const { q, value, hidden } = qValues(features, this.w);
    const probs = softmax(q, this.w.temperature);
    let greedy = 0;
    for (let i = 1; i < q.length; i++) if (q[i] > q[greedy]) greedy = i;
    const explore = this.rng.next() < this.epsilon;
    const action = explore ? this.rng.int(0, ACTIONS.length - 1) : greedy;
    const confidence = probs[action];
    // Size: share of the cash (buy) or of the holding (sell), larger when the policy is confident.
    const size = Math.min(1, Math.max(0.15, (confidence - 1 / 3) * 1.6 + 0.15));
    const eps = this.epsilon;
    this.epsilon = Math.max(this.w.epsilon.min, this.epsilon * this.w.epsilon.decay);
    return {
      q, value, hidden, probs, greedy, action, name: ACTIONS[action], explore, confidence, size, epsilon: eps,
    };
  }
}
