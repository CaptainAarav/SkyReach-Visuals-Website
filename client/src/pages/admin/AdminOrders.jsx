import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

const statusOptions = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
const statusColors = {
  PENDING: 'bg-amber-500/20 text-amber-400',
  CONFIRMED: 'bg-emerald-500/20 text-emerald-400',
  COMPLETED: 'bg-cream/20 text-cream',
  CANCELLED: 'bg-red/20 text-red',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    api.get('/api/admin/orders')
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = (id, status) => {
    setUpdating(id);
    api.patch('/api/admin/orders/' + id, { status }).then(() => {
      setOrders((list) =>
        list.map((o) => (o.id === id ? { ...o, status } : o))
      );
    }).catch((err) => setError(err.message)).finally(() => setUpdating(null));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {error && <p className="text-sm text-red mb-4">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/20">
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Client</th>
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Package</th>
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Date</th>
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Status</th>
              <th className="pb-3 text-xs font-semibold uppercase text-cream/60">Actions</th>
            </tr>
          </thead>
          <tbody className="text-cream/90">
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-white/10">
                <td className="py-4 pr-4">
                  <p className="font-medium text-white">{order.user?.name}</p>
                  <p className="text-sm text-cream/60">{order.user?.email}</p>
                </td>
                <td className="py-4 pr-4">{order.packageName}</td>
                <td className="py-4 pr-4">
                  {new Date(order.shootDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="py-4 pr-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                </td>
                <td className="py-4">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    disabled={updating === order.id}
                    className="bg-bg border border-white/20 rounded-lg py-1.5 px-2 text-sm text-cream"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {orders.length === 0 && !loading && (
        <p className="text-cream/60 py-8">No orders yet.</p>
      )}
    </div>
  );
}
