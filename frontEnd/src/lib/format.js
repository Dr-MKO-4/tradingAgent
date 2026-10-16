// src/lib/format.js : formatters (fr-FR)
const nf = (min, max) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: min, maximumFractionDigits: max });
const n0 = nf(0, 0);
const n2 = nf(2, 2);

export const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

export function money(v, digits = 0) {
  if (!isNum(v)) return '-';
  return `${(digits ? n2 : n0).format(v)} $`;
}

export function num(v, digits = 2) {
  if (!isNum(v)) return '-';
  return nf(digits, digits).format(v);
}

export function pct(v, digits = 1, signed = true) {
  if (!isNum(v)) return '-';
  const s = nf(digits, digits).format(Math.abs(v));
  const sign = v > 0 ? '+' : v < 0 ? '-' : '';
  return `${signed ? sign : v < 0 ? '-' : ''}${s} %`;
}

export function trend(v) {
  if (!isNum(v) || v === 0) return 'flat';
  return v > 0 ? 'up' : 'down';
}

export function date(v, opts = { day: '2-digit', month: 'short', year: 'numeric' }) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('fr-FR', opts);
}

export function dateTime(v) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Summary metrics computed from a portfolio series [{date, value}]
export function seriesStats(series) {
  if (!Array.isArray(series) || series.length < 2) return null;
  const vals = series.map((p) => Number(p.value)).filter(isNum);
  if (vals.length < 2) return null;
  const first = vals[0];
  const last = vals[vals.length - 1];
  let peak = -Infinity;
  let dd = 0;
  for (const v of vals) {
    if (v > peak) peak = v;
    dd = Math.max(dd, (peak - v) / peak);
  }
  return { first, last, change: last - first, ret: ((last - first) / first) * 100, maxDrawdown: dd * 100 };
}
