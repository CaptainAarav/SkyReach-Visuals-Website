import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import CountUp from '../../components/CountUp.jsx';

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
            className={`text-sm font-medium px-5 py-2.5 rounded-full transition-all duration-300 ${
              period === p.value
                ? 'bg-gradient-to-r from-accent to-accent-light text-white shadow-[0_0_20px_rgba(124,58,237,0.3)]'
                : 'bg-white/[0.04] text-cream/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {stats && (
        <>
          <div className="relative bg-bg-card/70 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8 mb-8 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent via-red to-accent animate-gradient-x" />
            <p className="text-xs font-semibold uppercase tracking-widest text-cream/40 mb-2">
              Revenue ({PERIODS.find((p) => p.value === period)?.label})
            </p>
            <p className="text-4xl md:text-5xl font-bold text-gradient">
              <CountUp value={stats.revenue / 100} decimals={2} prefix="£" duration={1200} />
            </p>
            <p className="mt-2 text-sm text-cream/40">
              From confirmed and completed bookings
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/admin/messages"><StatCard label="Total Quotes" value={stats.totalQuotes} color="text-blue-400" glow="rgba(59,130,246,0.1)" /></Link>
            <Link to="/admin/orders"><StatCard label="Total Bookings" value={stats.totalBookings} color="text-amber-400" glow="rgba(251,191,36,0.1)" /></Link>
            <Link to="/admin/orders?status=accepted"><StatCard label="Total Accepted" value={stats.totalAccepted} color="text-emerald-400" glow="rgba(16,185,129,0.1)" /></Link>
            <Link to="/admin/orders?status=declined"><StatCard label="Total Declined" value={stats.totalDeclined} color="text-red-400" glow="rgba(220,38,38,0.1)" /></Link>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color, glow }) {
  return (
    <div className="group bg-bg-card/70 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1" style={{ '--glow': glow }}>
      <p className="text-xs font-semibold uppercase tracking-widest text-cream/40 mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>
        <CountUp value={value} duration={1000} />
      </p>
    </div>
  );
}
