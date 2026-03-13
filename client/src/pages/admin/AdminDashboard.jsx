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
  const today = () => new Date().toISOString().slice(0, 10);
  const [trafficFrom, setTrafficFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  });
  const [trafficTo, setTrafficTo] = useState(today);
  const [traffic, setTraffic] = useState(null);
  const [trafficLoading, setTrafficLoading] = useState(false);

  const setTrafficPeriod = (preset) => {
    const now = new Date();
    const to = today();
    if (preset === 'today') {
      setTrafficFrom(to);
      setTrafficTo(to);
    } else if (preset === 'month') {
      setTrafficFrom(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10));
      setTrafficTo(to);
    } else if (preset === 'year') {
      setTrafficFrom(new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10));
      setTrafficTo(to);
    } else if (preset === 'all') {
      setTrafficFrom('2020-01-01');
      setTrafficTo(to);
    }
  };

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
      .then((data) => setTraffic(data))
      .catch(() => setTraffic(null))
      .finally(() => setTrafficLoading(false));
  };
  useEffect(loadTraffic, [trafficFrom, trafficTo]);

  const [resettingTraffic, setResettingTraffic] = useState(false);
  const handleResetTraffic = () => {
    if (!window.confirm('Reset all session counts to 0? This cannot be undone.')) return;
    setResettingTraffic(true);
    api.delete('/api/admin/traffic')
      .then(loadTraffic)
      .catch((err) => setError(err.message))
      .finally(() => setResettingTraffic(false));
  };

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
            <p className="text-xs font-semibold uppercase tracking-widest text-cream/50 mb-2">Website traffic (sessions)</p>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {[
                { preset: 'today', label: 'Today' },
                { preset: 'month', label: 'This month' },
                { preset: 'year', label: 'This year' },
                { preset: 'all', label: 'Whole time' },
              ].map(({ preset, label }) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTrafficPeriod(preset)}
                  className="text-sm font-medium px-3 py-1.5 rounded-lg bg-bg text-cream/80 hover:text-white border border-white/10 transition-colors"
                >
                  {label}
                </button>
              ))}
              <label className="flex items-center gap-1.5 text-sm text-cream/60 ml-2">
                <span>From</span>
                <input
                  type="date"
                  value={trafficFrom}
                  onChange={(e) => setTrafficFrom(e.target.value)}
                  className="bg-bg border border-white/20 rounded-lg py-1 px-2 text-white text-sm w-36"
                />
              </label>
              <label className="flex items-center gap-1.5 text-sm text-cream/60">
                <span>To</span>
                <input
                  type="date"
                  value={trafficTo}
                  onChange={(e) => setTrafficTo(e.target.value)}
                  className="bg-bg border border-white/20 rounded-lg py-1 px-2 text-white text-sm w-36"
                />
              </label>
              {traffic && (
                <span className="text-lg font-bold text-white ml-auto">
                  Total: <CountUp value={traffic.total} duration={800} /> sessions
                </span>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleResetTraffic}
                  disabled={resettingTraffic}
                  className="text-sm font-medium px-3 py-1.5 rounded-lg bg-red/20 text-red hover:bg-red/30 disabled:opacity-50"
                >
                  {resettingTraffic ? 'Resetting…' : 'Reset to 0'}
                </button>
              )}
            </div>
            {trafficLoading && <p className="text-sm text-cream/50">Loading…</p>}
            {!trafficLoading && traffic && (
              <div className="mt-4">
                {traffic.daily.length === 0 ? (
                  <p className="text-sm text-cream/50">No traffic in this period.</p>
                ) : (
                  <TrafficLineChart daily={traffic.daily} />
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

function niceMax(n) {
  if (n <= 0) return 5;
  const exp = Math.pow(10, Math.floor(Math.log10(n)));
  const mant = n / exp;
  const step = mant <= 1 ? 1 : mant <= 2 ? 2 : mant <= 5 ? 5 : 10;
  return step * exp;
}

function TrafficLineChart({ daily }) {
  const width = 640;
  const height = 240;
  const paddingLeft = 36;
  const paddingRight = 12;
  const paddingTop = 12;
  const paddingBottom = 28;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const maxViews = Math.max(...daily.map((d) => d.views), 1);
  const yMax = niceMax(maxViews);
  const n = daily.length;
  const stepX = n > 1 ? chartW / (n - 1) : chartW;

  const points = daily.map((d, i) => {
    const x = paddingLeft + i * stepX;
    const y = paddingTop + chartH - (d.views / yMax) * chartH;
    return `${x},${y}`;
  });
  const linePath = points.length > 0 ? `M ${points.join(' L ')}` : '';

  const yStep = yMax <= 5 ? 1 : yMax <= 10 ? 2 : Math.ceil(yMax / 5);
  const yTicks = [];
  for (let v = 0; v <= yMax; v += yStep) yTicks.push(v);
  if (yTicks[yTicks.length - 1] !== yMax) yTicks.push(yMax);

  const xTickStep = Math.max(1, Math.floor(n / 8));
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" preserveAspectRatio="xMidYMid meet">
      {/* Y-axis labels (left) */}
      {yTicks.map((v) => {
        const y = paddingTop + chartH - (v / yMax) * chartH;
        return (
          <g key={v}>
            <line x1={paddingLeft} y1={y} x2={paddingLeft + chartW} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="2,2" />
            <text x={paddingLeft - 6} y={y + 4} textAnchor="end" className="fill-cream/60 text-[10px] font-medium">{v}</text>
          </g>
        );
      })}
      {/* X-axis labels (bottom) */}
      {daily.map((d, i) => {
        if (i % xTickStep !== 0 && i !== n - 1) return null;
        const x = paddingLeft + i * stepX;
        return (
          <text key={`${d.date}-${i}`} x={x} y={height - 6} textAnchor="middle" className="fill-cream/50 text-[10px]">{d.date.slice(5)}</text>
        );
      })}
      {/* Line */}
      <path d={linePath} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Points */}
      {daily.map((d, i) => {
        const x = paddingLeft + i * stepX;
        const y = paddingTop + chartH - (d.views / yMax) * chartH;
        return <circle key={d.date} cx={x} cy={y} r="3" className="fill-accent" />;
      })}
    </svg>
  );
}
