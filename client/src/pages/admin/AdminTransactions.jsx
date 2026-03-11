import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { formatOrderNumber } from '../../utils/format.js';

const statusLabels = {
  pending: 'Pending',
  waiting_for_payment: 'Waiting for payment',
  completed: 'Completed',
};

const statusColors = {
  pending: 'bg-amber-500/20 text-amber-400',
  waiting_for_payment: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
};

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all | pending | waiting_for_payment | completed

  useEffect(() => {
    setLoading(true);
    api.get('/api/admin/transactions')
      .then(setTransactions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? transactions
    : transactions.filter((t) => t.status === filter);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {error && <p className="text-sm text-red mb-4">{error}</p>}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${filter === 'all' ? 'bg-accent text-white' : 'bg-bg-card text-cream/80 hover:text-white border border-white/10'}`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilter('pending')}
          className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${filter === 'pending' ? 'bg-accent text-white' : 'bg-bg-card text-cream/80 hover:text-white border border-white/10'}`}
        >
          Pending
        </button>
        <button
          type="button"
          onClick={() => setFilter('waiting_for_payment')}
          className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${filter === 'waiting_for_payment' ? 'bg-accent text-white' : 'bg-bg-card text-cream/80 hover:text-white border border-white/10'}`}
        >
          Waiting for payment
        </button>
        <button
          type="button"
          onClick={() => setFilter('completed')}
          className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${filter === 'completed' ? 'bg-accent text-white' : 'bg-bg-card text-cream/80 hover:text-white border border-white/10'}`}
        >
          Completed
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/20">
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Order</th>
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Client</th>
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Amount</th>
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Status</th>
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Date</th>
              <th className="pb-3 text-xs font-semibold uppercase text-cream/60">Paid</th>
            </tr>
          </thead>
          <tbody className="text-cream/90">
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-white/10">
                <td className="py-4 pr-4 text-sm font-semibold text-white">
                  {t.orderNumber != null ? formatOrderNumber(t.orderNumber) : '—'}
                </td>
                <td className="py-4 pr-4">
                  <p className="font-medium text-white">{t.clientName}</p>
                  <a href={`mailto:${t.clientEmail}`} className="text-sm text-cream/60 hover:text-accent transition-colors">{t.clientEmail}</a>
                </td>
                <td className="py-4 pr-4 font-medium">&pound;{(t.amount / 100).toFixed(2)}</td>
                <td className="py-4 pr-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg ${statusColors[t.status] || 'bg-white/10 text-cream'}`}>
                    {statusLabels[t.status] ?? t.status}
                  </span>
                </td>
                <td className="py-4 pr-4 text-sm">
                  {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </td>
                <td className="py-4 pr-4 text-sm text-cream/70">
                  {t.paidAt ? new Date(t.paidAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && !loading && (
        <p className="text-cream/60 py-8">No transactions match the filter.</p>
      )}
    </div>
  );
}
