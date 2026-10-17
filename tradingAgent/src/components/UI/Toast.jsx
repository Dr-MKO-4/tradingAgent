// src/components/UI/Toast.jsx
import React, { useEffect } from 'react';
export default function Toast({ message, duration=3000, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return ()=>clearTimeout(t);
  }, []);
  return <div className="toast">{message}</div>;
}
