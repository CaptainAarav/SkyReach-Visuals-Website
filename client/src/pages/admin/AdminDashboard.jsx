import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { api } from '../../api/client.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import CountUp from '../../components/CountUp.jsx';

const PERIODS = [
  { value: 'overall', label: 'Overall' },
  { value: 'yearly', label: 'This Year' },
  { value: 'monthly', label: 'This Month' },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('overall');
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [externalAmount, setExternalAmount] = useState('');
  const [externalLabel, setExternalLabel] = useState('');
  const [externalSubmitting, setExternalSubmitting] = useState(false);
  const [externalError, setExternalError] = useState(null);
  const [trafficFrom, setTrafficFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  });
  const [trafficTo, setTrafficTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [traffic, setTraffic] = useState(null);
  const [trafficLoading, setTrafficLoading] = useState(false);

  const loadStats = () => {
    setLoading(true);
    api.get(`/api/admin/stats?period=${period}`)
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadStats, [period]);

  const loadTraffic = () => {
    setTrafficLoading(true);
    api.get(`/api/admin/traffic?from=${trafficFrom}&to=${trafficTo}`)
      .then(setTraffic)
      .catch(() => setTraffic(null))
      .finally(() => setTrafficLoading(false));
  };
  useEffect(loadTraffic, [trafficFrom, trafficTo]);

  const handleAddExternalProject = async (e) => {
    e.preventDefault();
    const amount = parseFloat(externalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setExternalError('Enter a valid amount in pounds');
      return;
    }
    setExternalError(null);
    setExternalSubmitting(true);
    try {
      await api.post('/api/admin/external-projects', { amount, label: externalLabel.trim() || undefined });
      setShowExternalModal(false);
      setExternalAmount('');
      setExternalLabel('');
      loadStats();
    } catch (err) {
      setExternalError(err.message);
    } finally {
      setExternalSubmitting(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

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
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowExternalModal(true)}
            className="text-sm font-medium px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors"
          >
            Add external project
          </button>
        )}
      </div>

      {stats && (
        <>
          <div className="bg-bg-card border border-white/10 rounded-2xl p-8 mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-cream/50 mb-2">
              Revenue ({PERIODS.find((p) => p.value === period)?.label})
            </p>
            <p className="text-4xl md:text-5xl font-bold text-white">
              <CountUp value={stats.revenue / 100} decimals={2} prefix="£" duration={1200} />
            </p>
            <p className="mt-2 text-sm text-cream/50">
              From confirmed and completed bookings and external projects
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/admin/messages"><StatCard label="Total Quotes" value={stats.totalQuotes} color="text-blue-400" /></Link>
            <Link to="/admin/orders"><StatCard label="Total Bookings" value={stats.totalBookings} color="text-amber-400" /></Link>
            <Link to="/admin/orders?status=accepted"><StatCard label="Total Accepted" value={stats.totalAccepted} color="text-emerald-400" /></Link>
            <Link to="/admin/orders?status=declined"><StatCard label="Total Declined" value={stats.totalDeclined} color="text-red-400" /></Link>
          </div>

          <div className="bg-bg-card border border-white/10 rounded-2xl p-8 mt-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-cream/50 mb-2">Website traffic</p>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm text-cream/80">
                <span>From</span>
                <input
                  type="date"
                  value={trafficFrom}
                  onChange={(e) => setTrafficFrom(e.target.value)}
                  className="bg-bg border border-white/20 rounded-lg py-1.5 px-2 text-white text-sm"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-cream/80">
                <span>To</span>
                <input
                  type="date"
                  value={trafficTo}
                  onChange={(e) => setTrafficTo(e.target.value)}
                  className="bg-bg border border-white/20 rounded-lg py-1.5 px-2 text-white text-sm"
                />
              </label>
              {traffic && (
                <span className="text-lg font-bold text-white">
                  Total: <CountUp value={traffic.total} duration={800} /> views
                </span>
              )}
            </div>
            {trafficLoading && <p className="text-sm text-cream/50">Loading…</p>}
            {!trafficLoading && traffic && (
              <div className="mt-4">
                {traffic.daily.length === 0 ? (
                  <p className="text-sm text-cream/50">No traffic in this period.</p>
                ) : (
                  <div className="flex items-end gap-1 h-32">
                    {traffic.daily.map(({ date, views }) => {
                      const max = Math.max(...traffic.daily.map((d) => d.views), 1);
                      const pct = (views / max) * 100;
                      return (
                        <div
                          key={date}
                          className="flex-1 min-w-0 flex flex-col items-center group"
                          title={`${date}: ${views} views`}
                        >
                          <div
                            className="w-full bg-accent/80 rounded-t min-h-[4px] transition-all group-hover:bg-accent"
                            style={{ height: `${pct}%` }}
                          />
                          <span className="text-[10px] text-cream/50 mt-1 truncate w-full text-center">{date.slice(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {showExternalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => !externalSubmitting && setShowExternalModal(false)}>
          <div className="bg-bg-card border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Add external project</h3>
            <p className="text-sm text-cream/60 mb-4">Record revenue from a project outside the website. It will be included in dashboard revenue.</p>
            <form onSubmit={handleAddExternalProject} className="space-y-4">
              <div>
                <label htmlFor="externalAmount" className="block text-sm font-medium text-cream/80 mb-1">Amount paid (£)</label>
                <input
                  id="externalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={externalAmount}
                  onChange={(e) => setExternalAmount(e.target.value)}
                  className="w-full bg-bg border border-white/20 rounded-xl py-2 px-3 text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="externalLabel" className="block text-sm font-medium text-cream/80 mb-1">Label (optional)</label>
                <input
                  id="externalLabel"
                  type="text"
                  value={externalLabel}
                  onChange={(e) => setExternalLabel(e.target.value)}
                  placeholder="e.g. Corporate video – Acme Ltd"
                  className="w-full bg-bg border border-white/20 rounded-xl py-2 px-3 text-white placeholder:text-cream/40"
                />
              </div>
              {externalError && <p className="text-sm text-red">{externalError}</p>}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowExternalModal(false)} disabled={externalSubmitting} className="px-4 py-2 text-sm text-cream/80 hover:text-white">
                  Cancel
                </button>
                <button type="submit" disabled={externalSubmitting} className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50">
                  {externalSubmitting ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-bg-card border border-white/10 rounded-2xl p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-cream/50 mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>
        <CountUp value={value} duration={1000} />
      </p>
    </div>
  );
}
