import { useEffect, useState } from 'react';
import axios from 'axios';

export default function CryptoSelector({ value, onChange }) {
  const [list, setList] = useState([]);

  useEffect(() => {
    axios.get('/assets/cryptos.json').then(res => setList(res.data));
  }, []);

  return (
    <select className="border p-2 rounded" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">Select Crypto</option>
      {list.map(c => (
        <option key={c.symbol} value={c.symbol}>{c.name}</option>
      ))}
    </select>
  );
}
