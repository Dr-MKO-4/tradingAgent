// src/lib/sim/rng.js : reproducible pseudo-random numbers (mulberry32 + Box-Muller).

export function hashSeed(value) {
  const str = String(value);
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function randomSeed() {
  try {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % 1000000;
  } catch {
    return Math.floor(Math.random() * 1000000);
  }
}

export function makeRng(seed) {
  let s = (typeof seed === 'number' ? seed : hashSeed(seed)) >>> 0;
  let spare = null;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const normal = () => {
    if (spare !== null) {
      const v = spare;
      spare = null;
      return v;
    }
    let u = 0;
    let v = 0;
    while (u === 0) u = next();
    while (v === 0) v = next();
    const r = Math.sqrt(-2 * Math.log(u));
    spare = r * Math.sin(2 * Math.PI * v);
    return r * Math.cos(2 * Math.PI * v);
  };
  return {
    next,
    normal,
    range: (a, b) => a + (b - a) * next(),
    int: (a, b) => a + Math.floor(next() * (b - a + 1)),
  };
}
