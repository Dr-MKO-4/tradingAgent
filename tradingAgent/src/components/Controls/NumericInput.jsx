// src/components/Controls/NumericInput.jsx
import React from 'react';
export default function NumericInput({ value, onChange, ...p }) {
  return (
    <input
      type="number" value={value}
      onChange={e=>onChange(Number(e.target.value))}
      {...p}
    />
  );
}
