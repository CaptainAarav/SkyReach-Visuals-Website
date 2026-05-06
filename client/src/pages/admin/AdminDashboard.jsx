import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock.js';
import { api } from '../../api/client.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import CountUp from '../../components/CountUp.jsx';
import { DirectInvoiceModal } from '../../components/admin/DirectInvoiceModal.jsx';

const PencilIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

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
  const [externalCustomerTab, setExternalCustomerTab] = useState('revenue');
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
  const [trafficTo, setTrafficTo] = useState(() => today());
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

  const [editingRevenue, setEditingRevenue] = useState(false);
  const [revenueInput, setRevenueInput] = useState('');
  const [savingRevenue, setSavingRevenue] = useState(false);
  const startEditRevenue = () => {
    setRevenueInput((stats?.revenue ?? 0) / 100 + '');
    setEditingRevenue(true);
  };
  const saveRevenue = async () => {
    const pounds = parseFloat(revenueInput);
    if (Number.isNaN(pounds) || pounds < 0) return;
    setSavingRevenue(true);
    try {
      await api.patch('/api/admin/settings', { revenueOverridePence: Math.round(pounds * 100) });
      setEditingRevenue(false);
      loadStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingRevenue(false);
    }
  };

  const [editingBookings, setEditingBookings] = useState(false);
  const [bookingsInput, setBookingsInput] = useState('');
  const [savingBookings, setSavingBookings] = useState(false);
  const startEditBookings = () => {
    setBookingsInput(String(stats?.totalBookings ?? 0));
    setEditingBookings(true);
  };
  const saveBookings = async () => {
    const n = parseInt(bookingsInput, 10);
    if (Number.isNaN(n) || n < 0) return;
    setSavingBookings(true);
    try {
      await saveOverride('totalBookingsOverride', n);
      setEditingBookings(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingBookings(false);
    }
  };

  const saveOverride = async (key, value) => {
    try {
      await api.patch('/api/admin/settings', { [key]: value });
      loadStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const [editingQuotes, setEditingQuotes] = useState(false);
  const [quotesInput, setQuotesInput] = useState('');
  const [savingQuotes, setSavingQuotes] = useState(false);
  const startEditQuotes = () => { setQuotesInput(String(stats?.totalQuotes ?? 0)); setEditingQuotes(true); };
  const saveQuotes = async () => {
    const n = parseInt(quotesInput, 10);
    if (Number.isNaN(n) || n < 0) return;
    setSavingQuotes(true);
    try {
      await saveOverride('totalQuotesOverride', n);
      setEditingQuotes(false);
    } finally {
      setSavingQuotes(false);
    }
  };

  const [editingAccepted, setEditingAccepted] = useState(false);
  const [acceptedInput, setAcceptedInput] = useState('');
  const [savingAccepted, setSavingAccepted] = useState(false);
  const startEditAccepted = () => { setAcceptedInput(String(stats?.totalAccepted ?? 0)); setEditingAccepted(true); };
  const saveAccepted = async () => {
    const n = parseInt(acceptedInput, 10);
    if (Number.isNaN(n) || n < 0) return;
    setSavingAccepted(true);
    try {
      await saveOverride('totalAcceptedOverride', n);
      setEditingAccepted(false);
    } finally {
      setSavingAccepted(false);
    }
  };

  const [editingDeclined, setEditingDeclined] = useState(false);
  const [declinedInput, setDeclinedInput] = useState('');
  const [savingDeclined, setSavingDeclined] = useState(false);
  const startEditDeclined = () => { setDeclinedInput(String(stats?.totalDeclined ?? 0)); setEditingDeclined(true); };
  const saveDeclined = async () => {
    const n = parseInt(declinedInput, 10);
    if (Number.isNaN(n) || n < 0) return;
    setSavingDeclined(true);
    try {
      await saveOverride('totalDeclinedOverride', n);
      setEditingDeclined(false);
    } finally {
      setSavingDeclined(false);
    }
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
      setExternalCustomerTab('revenue');
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

  useBodyScrollLock(showExternalModal);

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
            onClick={() => {
              setExternalCustomerTab('revenue');
              setShowExternalModal(true);
            }}
            className="text-sm font-medium px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors"
          >
            External customer
          </button>
        )}
      </div>

      {stats && (
        <>
          <div className="bg-bg-card border border-white/10 rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-cream/50">
                Revenue ({PERIODS.find((p) => p.value === period)?.label})
              </p>
              {isAdmin && !editingRevenue && (
                <button type="button" onClick={startEditRevenue} className="p-1 text-cream/50 hover:text-white rounded" aria-label="Edit revenue">
                  <PencilIcon className="w-4 h-4" />
                </button>
              )}
            </div>
            {editingRevenue ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-2xl text-cream/80">£</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={revenueInput}
                  onChange={(e) => setRevenueInput(e.target.value)}
                  className="bg-bg border border-white/20 rounded-lg py-2 px-3 text-2xl font-bold text-white w-32"
                  autoFocus
                />
                <button type="button" onClick={saveRevenue} disabled={savingRevenue} className="text-sm font-medium bg-accent text-white px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50">Save</button>
                <button type="button" onClick={() => setEditingRevenue(false)} className="text-sm text-cream/70 hover:text-white">Cancel</button>
              </div>
            ) : (
              <p className="text-4xl md:text-5xl font-bold text-white">
                <CountUp value={stats.revenue / 100} decimals={2} prefix="£" duration={1200} />
              </p>
            )}
            <p className="mt-2 text-sm text-cream/50">
              From confirmed and completed bookings and external projects
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Quotes"
              value={stats.totalQuotes}
              color="text-blue-400"
              href="/admin/messages"
              isAdmin={isAdmin}
              editing={editingQuotes}
              editInput={quotesInput}
              onEditInputChange={setQuotesInput}
              onStartEdit={startEditQuotes}
              onSave={saveQuotes}
              onCancel={() => setEditingQuotes(false)}
              saving={savingQuotes}
              PencilIcon={PencilIcon}
            />
            <StatCard
              label="Total Bookings"
              value={stats.totalBookings}
              color="text-amber-400"
              href="/admin/orders"
              isAdmin={isAdmin}
              editing={editingBookings}
              editInput={bookingsInput}
              onEditInputChange={setBookingsInput}
              onStartEdit={startEditBookings}
              onSave={saveBookings}
              onCancel={() => setEditingBookings(false)}
              saving={savingBookings}
              PencilIcon={PencilIcon}
            />
            <StatCard
              label="Total Accepted"
              value={stats.totalAccepted}
              color="text-emerald-400"
              href="/admin/orders?status=accepted"
              isAdmin={isAdmin}
              editing={editingAccepted}
              editInput={acceptedInput}
              onEditInputChange={setAcceptedInput}
              onStartEdit={startEditAccepted}
              onSave={saveAccepted}
              onCancel={() => setEditingAccepted(false)}
              saving={savingAccepted}
              PencilIcon={PencilIcon}
            />
            <StatCard
              label="Total Declined"
              value={stats.totalDeclined}
              color="text-red-400"
              href="/admin/orders?status=declined"
              isAdmin={isAdmin}
              editing={editingDeclined}
              editInput={declinedInput}
              onEditInputChange={setDeclinedInput}
              onStartEdit={startEditDeclined}
              onSave={saveDeclined}
              onCancel={() => setEditingDeclined(false)}
              saving={savingDeclined}
              PencilIcon={PencilIcon}
            />
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
                {!Array.isArray(traffic.daily) || traffic.daily.length === 0 ? (
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overscroll-contain"
          aria-modal="true"
          role="presentation"
        >
          <div
            className={`bg-bg-card border border-white/10 rounded-2xl p-8 w-full shadow-xl max-h-[90vh] overflow-y-auto ${externalCustomerTab === 'invoice' ? 'max-w-xl' : 'max-w-md'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="text-xl font-bold text-white">External customer</h3>
              <button
                type="button"
                className="text-cream/60 hover:text-white text-xl shrink-0"
                onClick={() => {
                  setShowExternalModal(false);
                  setExternalCustomerTab('revenue');
                }}
                disabled={externalSubmitting}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                type="button"
                onClick={() => setExternalCustomerTab('revenue')}
                className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${
                  externalCustomerTab === 'revenue'
                    ? 'bg-accent text-white'
                    : 'bg-bg border border-white/15 text-cream/80 hover:text-white'
                }`}
              >
                Record external revenue
              </button>
              <button
                type="button"
                onClick={() => setExternalCustomerTab('invoice')}
                className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${
                  externalCustomerTab === 'invoice'
                    ? 'bg-accent text-white'
                    : 'bg-bg border border-white/15 text-cream/80 hover:text-white'
                }`}
              >
                Send direct invoice
              </button>
            </div>

            {externalCustomerTab === 'revenue' && (
            <>
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
                <button type="button" onClick={() => { setShowExternalModal(false); setExternalCustomerTab('revenue'); }} disabled={externalSubmitting} className="px-4 py-2 text-sm text-cream/80 hover:text-white">
                  Cancel
                </button>
                <button type="submit" disabled={externalSubmitting} className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50">
                  {externalSubmitting ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
            </>
            )}

            {externalCustomerTab === 'invoice' && (
              <DirectInvoiceModal
                variant="external"
                embedded
                onClose={() => {
                  setShowExternalModal(false);
                  setExternalCustomerTab('revenue');
                }}
                onSent={() => loadStats()}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  href,
  isAdmin,
  editing,
  editInput,
  onEditInputChange,
  onStartEdit,
  onSave,
  onCancel,
  saving,
  PencilIcon,
}) {
  const content = (
    <div className="bg-bg-card border border-white/10 rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-cream/50">{label}</p>
        {isAdmin && href && !editing && onStartEdit && (
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onStartEdit(); }} className="p-1 text-cream/50 hover:text-white rounded" aria-label={`Edit ${label}`}>
            <PencilIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <input
            type="number"
            min="0"
            value={editInput}
            onChange={(e) => onEditInputChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="bg-bg border border-white/20 rounded-lg py-1.5 px-2 text-xl font-bold text-white w-24"
          />
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSave(); }} disabled={saving} className="text-xs font-medium bg-accent text-white px-2 py-1 rounded-lg hover:opacity-90 disabled:opacity-50">Save</button>
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCancel(); }} className="text-xs text-cream/70 hover:text-white">Cancel</button>
        </div>
      ) : (
        <p className={`text-3xl font-bold ${color}`}>
          <CountUp value={value} duration={1000} />
        </p>
      )}
    </div>
  );
  if (href && !editing) return <Link to={href} className="block">{content}</Link>;
  return content;
}

function niceMax(n) {
  if (n <= 0) return 5;
  const exp = Math.pow(10, Math.floor(Math.log10(n)));
  const mant = n / exp;
  const step = mant <= 1 ? 1 : mant <= 2 ? 2 : mant <= 5 ? 5 : 10;
  return step * exp;
}

function TrafficLineChart({ daily }) {
  const rows = Array.isArray(daily)
    ? daily.map((d) => ({
        date: typeof d.date === 'string' ? d.date : String(d.date ?? ''),
        views: Number(d.views) || 0,
      }))
    : [];
  const width = 640;
  const height = 240;
  const paddingLeft = 36;
  const paddingRight = 12;
  const paddingTop = 12;
  const paddingBottom = 28;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const maxViews = Math.max(...rows.map((d) => d.views), 1);
  const yMax = niceMax(maxViews);
  const n = rows.length;
  const stepX = n > 1 ? chartW / (n - 1) : chartW;

  const points = rows.map((d, i) => {
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
      {rows.map((d, i) => {
        if (i % xTickStep !== 0 && i !== n - 1) return null;
        const x = paddingLeft + i * stepX;
        const short = d.date.length >= 5 ? d.date.slice(5) : d.date;
        return (
          <text key={`${d.date}-${i}`} x={x} y={height - 6} textAnchor="middle" className="fill-cream/50 text-[10px]">{short}</text>
        );
      })}
      {/* Line */}
      <path d={linePath} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Points */}
      {rows.map((d, i) => {
        const x = paddingLeft + i * stepX;
        const y = paddingTop + chartH - (d.views / yMax) * chartH;
        return <circle key={`${d.date}-${i}`} cx={x} cy={y} r="3" className="fill-accent" />;
      })}
    </svg>
  );
}
