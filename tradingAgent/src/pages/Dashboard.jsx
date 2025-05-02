import { useState, useEffect } from 'react';
import CryptoSelector from '../components/CryptoSelector';
import AgentSelector from '../components/AgentSelector';
import Filters from '../components/Filters';
import ChartDisplay from '../components/ChartDisplay';
import Loader from '../components/Loader';
import { fetchSimulations } from '../services/api';

export default function Dashboard() {
  const [agent, setAgent]     = useState('');
  const [crypto, setCrypto]   = useState('');
  const [filters, setFilters] = useState({ startDate: '', endDate: '', minTrade: '' });
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (agent && crypto) {
      setLoading(true);
      fetchSimulations({ agent, crypto, filters })
        .then(res => setData(res.portfolio))
        .finally(() => setLoading(false));
    }
  }, [agent, crypto, filters]);

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <AgentSelector value={agent} onChange={setAgent} />
        <CryptoSelector value={crypto} onChange={setCrypto} />
        <Filters filters={filters} onChange={setFilters} />
      </div>

      {loading
        ? <Loader />
        : data.length > 0
          ? <ChartDisplay data={data} />
          : <p>Select agent & crypto to view results.</p>
      }
    </div>
  );
}
