// src/hooks/useFetch.js
import { useState, useEffect } from 'react';
export default function useFetch(url, options) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();
  useEffect(() => {
    let mounted = true;
    fetch(url, options)
      .then(res => res.json())
      .then(json => mounted && setData(json))
      .catch(err => mounted && setError(err))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, [url, JSON.stringify(options)]);
  return { data, loading, error };
}
