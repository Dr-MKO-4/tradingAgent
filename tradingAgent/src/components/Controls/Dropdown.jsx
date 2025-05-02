// src/components/Controls/Dropdown.jsx
import React from 'react';
export default function Dropdown({ options, value, onChange }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}>
      {options.map(o=> <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
