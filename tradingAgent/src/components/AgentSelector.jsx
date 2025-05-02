export default function AgentSelector({ value, onChange }) {
    const agents = ['DQN-v1', 'DQN-v2', 'DoubleDQN'];
    return (
      <select className="border p-2 rounded" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Select Agent</option>
        {agents.map(a => <option key={a} value={a}>{a}</option>)}
      </select>
    );
  }
  