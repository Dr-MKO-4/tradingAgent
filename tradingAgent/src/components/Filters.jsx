export default function Filters({ filters, onChange }) {
    const handleInput = e => {
      onChange({ ...filters, [e.target.name]: e.target.value });
    };
  
    return (
      <div className="space-x-4">
        <input type="date" name="startDate" value={filters.startDate} onChange={handleInput} className="border p-2 rounded" />
        <input type="date" name="endDate"   value={filters.endDate}   onChange={handleInput} className="border p-2 rounded" />
        <input type="number" name="minTrade" placeholder="Min Profit" value={filters.minTrade} onChange={handleInput}
               className="border p-2 rounded w-24" />
      </div>
    );
  }
  