// src/components/UI/Toast.jsx
import React, { useEffect } from 'react';
import { LuCircleAlert } from 'react-icons/lu';

export default function Toast({ message, duration = 3000, onClose }) {
  useEffect(() => {
    if (!onClose) return undefined;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);
  return (
    <div className="alert alert-error" role="alert">
      <LuCircleAlert aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
