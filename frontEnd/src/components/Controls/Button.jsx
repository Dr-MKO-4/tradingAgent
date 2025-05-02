// src/components/Controls/Button.jsx
import React from 'react';
export default function Button({ children, ...p }) {
  return <button className="btn" {...p}>{children}</button>;
}
