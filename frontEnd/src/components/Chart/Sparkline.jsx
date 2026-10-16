// src/components/Chart/Sparkline.jsx
import React from 'react';

export default function Sparkline({ values, tone = 'accent', width = 84, height = 28 }) {
  const v = (values || []).filter(Number.isFinite);
  if (v.length < 2) return null;
  const min = Math.min(...v);
  const max = Math.max(...v);
  const d = v
    .map((n, i) => `${i ? 'L' : 'M'}${((i / (v.length - 1)) * width).toFixed(1)},${(2 + (1 - (n - min) / (max - min || 1)) * (height - 4)).toFixed(1)}`)
    .join('');
  const color = tone === 'up' ? 'var(--up)' : tone === 'down' ? 'var(--down)' : 'var(--accent)';
  return (
    <svg className="spark" viewBox={`0 0 ${width} ${height}`} aria-hidden="true" preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
