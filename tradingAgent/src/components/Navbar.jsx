import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-white shadow p-4 rounded-lg mb-4 flex justify-between">
      <div className="text-xl font-bold">SwiftPay Dashboard</div>
      <div className="space-x-4">
        <Link to="/" className="hover:underline">Dashboard</Link>
      </div>
    </nav>
  );
}
