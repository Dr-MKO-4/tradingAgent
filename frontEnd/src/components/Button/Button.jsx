// src/components/Button/Button.jsx
import React from 'react';

export default function Button({ onClick, children }) {
  return (
    <button onClick={onClick} style={{ padding: '8px 16px', margin: '10px' }}>
      {children}
    </button>
  );
}
