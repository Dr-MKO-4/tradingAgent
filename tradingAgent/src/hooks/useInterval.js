// src/hooks/useInterval.js
import { useEffect, useRef } from 'react';
export default function useInterval(callback, delay) {
  const saved = useRef();
  useEffect(() => { saved.current = callback; }, [callback]);
  useEffect(() => {
    if (delay != null) {
      const id = setInterval(() => saved.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
