import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

const PERIODS = [
  { value: 'overall', label: 'Overall' },
  { value: 'yearly', label: 'This Year' },
  { value: 'monthly', label: 'This Month' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('overall');

  useEffect(() => {
    setLoading(true);
    api.get(`/api/admin/stats?period=${period}`)
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading && !stats) return <LoadingSpinner />;

  return (
    <div>
      {error && <p className="text-sm text-red mb-4">{error}</p>}

      <div className="flex flex-wrap items-center gap-2 mb-8">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${
              period === p.value
                ? 'bg-accent text-white'
                : 'bg-bg-card text-cream/80 hover:text-white border border-white/10'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {stats && (
        <>
          <div className="bg-bg-card border border-white/10 rounded-2xl p-8 mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-cream/50 mb-2">
              Revenue ({PERIODS.find((p) => p.value === period)?.label})
            </p>
            <p className="text-4xl md:text-5xl font-bold text-white">
              &pound;{(stats.revenue / 100).toFixed(2)}
            </p>
            <p className="mt-2 text-sm text-cream/50">
              From confirmed and completed bookings
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/admin/messages"><StatCard label="Total Quotes" value={stats.totalQuotes} color="text-blue-400" /></Link>
            <Link to="/admin/orders"><StatCard label="Total Bookings" value={stats.totalBookings} color="text-amber-400" /></Link>
            <Link to="/admin/orders?status=accepted"><StatCard label="Total Accepted" value={stats.totalAccepted} color="text-emerald-400" /></Link>
            <Link to="/admin/orders?status=declined"><StatCard label="Total Declined" value={stats.totalDeclined} color="text-red-400" /></Link>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-bg-card border border-white/10 rounded-2xl p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-cream/50 mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
