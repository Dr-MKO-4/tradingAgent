// src/hooks/useLocalStorage.js
import { useState } from 'react';

export default function useLocalStorage(key, initial) {
  const [val, setValState] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored === null || stored === 'undefined') {
        return initial;
      }
      return JSON.parse(stored);
    } catch {
      return initial;
    }
  });

  const setVal = (v) => {
    setValState(v);
    try {
      window.localStorage.setItem(key, JSON.stringify(v));
    } catch {
      // ignore
    }
  };

  return [val, setVal];
}
