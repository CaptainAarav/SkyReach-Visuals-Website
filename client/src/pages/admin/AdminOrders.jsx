import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { formatOrderNumber } from '../../utils/format.js';

const statusOptions = ['PENDING', 'APPROVED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'DECLINED'];
const statusColors = {
  PENDING: 'bg-amber-500/20 text-amber-400',
  APPROVED: 'bg-blue-500/20 text-blue-400',
  CONFIRMED: 'bg-emerald-500/20 text-emerald-400',
  COMPLETED: 'bg-cream/20 text-cream',
  CANCELLED: 'bg-red/20 text-red',
  DECLINED: 'bg-red/20 text-red-400',
};

function ApproveModal({ order, onClose, onSave }) {
  const [quotedPrice, setQuotedPrice] = useState(
    order.packagePrice ? (order.packagePrice / 100).toFixed(2) : ''
  );
  const [adminNotes, setAdminNotes] = useState(order.adminNotes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const priceInPence = Math.round(parseFloat(quotedPrice) * 100);
      if (isNaN(priceInPence) || priceInPence <= 0) {
        setError('Please enter a valid price');
        setSaving(false);
        return;
      }
      const body = { status: 'APPROVED', quotedPrice: priceInPence };
      if (adminNotes !== (order.adminNotes || '')) body.adminNotes = adminNotes;
      const updated = await api.patch(`/api/admin/orders/${order.id}`, body);
      onSave(updated);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-bg-card border border-white/10 rounded-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Approve Booking</h2>
          <button onClick={onClose} className="text-cream/60 hover:text-white text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red">{error}</p>}
          <div>
            <p className="text-xs text-cream/50 mb-1">Client</p>
            <p className="text-sm text-white">{order.user?.name} ({order.user?.email})</p>
          </div>
          <div>
            <p className="text-xs text-cream/50 mb-1">Service</p>
            <p className="text-sm text-white">{order.packageName}</p>
          </div>
          <div>
            <label className="block text-xs text-cream/50 mb-1">Price (&pound;)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={quotedPrice}
              onChange={(e) => setQuotedPrice(e.target.value)}
              className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream"
              required
            />
            <p className="text-xs text-cream/40 mt-1">
              The customer will be charged this amount. An email with a payment link will be sent.
            </p>
          </div>
          <div>
            <label className="block text-xs text-cream/50 mb-1">Admin Notes (optional)</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
              className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream resize-none"
              placeholder="Internal notes..."
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {saving ? 'Approving...' : 'Approve & Send Payment Link'}
            </button>
            <button type="button" onClick={onClose} className="text-sm text-cream/60 hover:text-white px-4 py-2">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditOrderModal({ order, onClose, onSave }) {
  const [status, setStatus] = useState(order.status);
  const [shootDate, setShootDate] = useState(order.shootDate ? new Date(order.shootDate).toISOString().slice(0, 10) : '');
  const [shootTime, setShootTime] = useState(order.shootTime || '');
  const [adminNotes, setAdminNotes] = useState(order.adminNotes || '');
  const [quotedPrice, setQuotedPrice] = useState(order.packagePrice != null ? (order.packagePrice / 100).toFixed(2) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {};
      if (status !== order.status) body.status = status;
      if (shootDate && shootDate !== new Date(order.shootDate).toISOString().slice(0, 10)) body.shootDate = shootDate;
      if (shootTime !== (order.shootTime || '')) body.shootTime = shootTime;
      if (adminNotes !== (order.adminNotes || '')) body.adminNotes = adminNotes;
      if (quotedPrice !== '' && parseFloat(quotedPrice) !== order.packagePrice / 100) {
        body.quotedPrice = parseFloat(quotedPrice);
      }
      if (Object.keys(body).length === 0) {
        onClose();
        return;
      }
      const updated = await api.patch(`/api/admin/orders/${order.id}`, body);
      onSave(updated);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-bg-card border border-white/10 rounded-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Edit Booking</h2>
          <button onClick={onClose} className="text-cream/60 hover:text-white text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red">{error}</p>}

          <div>
            <p className="text-xs text-cream/50 mb-1">Client</p>
            <p className="text-sm text-white">{order.user?.name} ({order.user?.email})</p>
          </div>
          <div>
            <p className="text-xs text-cream/50 mb-1">Service</p>
            <p className="text-sm text-white">{order.packageName}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-cream/50 mb-1">Shoot Date</label>
              <input type="date" value={shootDate} onChange={(e) => setShootDate(e.target.value)} className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream" />
            </div>
            <div>
              <label className="block text-xs text-cream/50 mb-1">Shoot Time</label>
              <input type="text" value={shootTime} onChange={(e) => setShootTime(e.target.value)} placeholder="e.g. Morning (8am–12pm) or 2pm" className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-cream/50 mb-1">Change Price (£)</label>
            <input type="number" step="0.01" min="0" value={quotedPrice} onChange={(e) => setQuotedPrice(e.target.value)} className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream" />
          </div>

          <div>
            <label className="block text-xs text-cream/50 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream">
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-cream/50 mb-1">Admin Notes</label>
            <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream resize-none" placeholder="Internal notes about this booking..." />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-accent/80 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button type="button" onClick={onClose} className="text-sm text-cream/60 hover:text-white px-4 py-2">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const STATUS_FILTER_MAP = {
  accepted: ['APPROVED', 'CONFIRMED', 'COMPLETED'],
  declined: ['DECLINED'],
};

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Declined', value: 'declined' },
];

export default function AdminOrders() {
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [approvingOrder, setApprovingOrder] = useState(null);

  const [viewOrder, setViewOrder] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    params.set('sort', 'shootDate');
    params.set('order', 'asc');
    api.get(`/api/admin/orders?${params}`)
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const filteredOrders = orders;

  const declineOrder = async (id) => {
    setUpdating(id);
    try {
      const updated = await api.patch(`/api/admin/orders/${id}`, { status: 'DECLINED' });
      setOrders((list) => list.map((o) => o.id === id ? { ...o, ...updated } : o));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleEditSave = (updated) => {
    setOrders((list) => list.map((o) => o.id === updated.id ? { ...o, ...updated } : o));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {error && <p className="text-sm text-red mb-4">{error}</p>}
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.value || 'all'}
            onClick={() => setSearchParams(f.value ? { status: f.value } : {})}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              (f.value === '' && !statusFilter) || statusFilter === f.value
                ? 'bg-accent text-white'
                : 'bg-bg-card text-cream/80 hover:text-white border border-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-cream/50 mb-2">Sorted by shoot date (soonest first)</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/20">
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Order</th>
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Client</th>
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Service</th>
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Date</th>
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Time</th>
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Price</th>
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Status</th>
              <th className="pb-3 text-xs font-semibold uppercase text-cream/60">View</th>
            </tr>
          </thead>
          <tbody className="text-cream/90">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="border-b border-white/10">
                <td className="py-4 pr-4 text-sm font-semibold text-white">
                  {order.orderNumber != null ? formatOrderNumber(order.orderNumber) : '—'}
                </td>
                <td className="py-4 pr-4">
                  <p className="font-medium text-white">{order.user?.name}</p>
                  <a href={`mailto:${order.user?.email}`} className="text-sm text-cream/60 hover:text-accent transition-colors">{order.user?.email}</a>
                </td>
                <td className="py-4 pr-4">{order.packageName}</td>
                <td className="py-4 pr-4">
                  {new Date(order.shootDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="py-4 pr-4 text-sm text-cream/70">
                  {order.shootTime || '—'}
                </td>
                <td className="py-4 pr-4 text-sm font-medium">
                  &pound;{(order.packagePrice / 100).toFixed(2)}
                </td>
                <td className="py-4 pr-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg ${statusColors[order.status] || 'bg-white/10 text-cream'}`}>
                    {order.status}
                  </span>
                </td>
                <td className="py-4">
                  <button
                    onClick={() => setViewOrder(order)}
                    className="text-xs font-medium bg-white/10 text-cream px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredOrders.length === 0 && !loading && (
        <p className="text-cream/60 py-8">{statusFilter ? 'No matching orders.' : 'No orders yet.'}</p>
      )}

      {approvingOrder && (
        <ApproveModal
          order={approvingOrder}
          onClose={() => setApprovingOrder(null)}
          onSave={handleEditSave}
        />
      )}

      {viewOrder && (
        <ViewOrderModal
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onEdit={() => { setEditingOrder(viewOrder); setViewOrder(null); }}
          onAccept={() => { setApprovingOrder(viewOrder); setViewOrder(null); }}
          onDecline={async () => { await declineOrder(viewOrder.id); setViewOrder(null); }}
          onSave={handleEditSave}
        />
      )}

      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}

function ViewOrderModal({ order, onClose, onEdit, onAccept, onDecline }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-bg-card border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Order {order.orderNumber != null ? formatOrderNumber(order.orderNumber) : ''}</h2>
          <button onClick={onClose} className="text-cream/60 hover:text-white text-xl">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs text-cream/50 mb-1">Name</p>
            <p className="text-sm text-white">{order.user?.name}</p>
          </div>
          <div>
            <p className="text-xs text-cream/50 mb-1">Email</p>
            <a href={`mailto:${order.user?.email}`} className="text-sm text-accent hover:underline">{order.user?.email}</a>
          </div>
          <div>
            <p className="text-xs text-cream/50 mb-1">Phone</p>
            <p className="text-sm text-white">{order.phone || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-cream/50 mb-1">Service</p>
            <p className="text-sm text-white">{order.packageName}</p>
          </div>
          <div>
            <p className="text-xs text-cream/50 mb-1">Shoot date</p>
            <p className="text-sm text-white">{order.shootDate ? new Date(order.shootDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-cream/50 mb-1">Shoot time</p>
            <p className="text-sm text-white">{order.shootTime || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-cream/50 mb-1">Status</p>
            <p><span className={`text-xs font-medium px-2 py-1 rounded-lg ${statusColors[order.status] || 'bg-white/10 text-cream'}`}>{order.status}</span></p>
          </div>
          <div>
            <p className="text-xs text-cream/50 mb-1">Price</p>
            <p className="text-sm font-medium text-white">&pound;{(order.packagePrice / 100).toFixed(2)}</p>
          </div>
          {order.adminNotes && (
            <div>
              <p className="text-xs text-cream/50 mb-1">Admin notes</p>
              <p className="text-sm text-cream/80">{order.adminNotes}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
            {order.status === 'PENDING' && (
              <>
                <button type="button" onClick={onAccept} className="text-sm font-medium bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">Accept</button>
                <button type="button" onClick={onDecline} className="text-sm font-medium bg-red/80 text-white px-4 py-2 rounded-lg hover:bg-red">Decline</button>
              </>
            )}
            <button type="button" onClick={onEdit} className="text-sm font-medium bg-white/10 text-cream px-4 py-2 rounded-lg hover:bg-white/20">Edit Booking</button>
          </div>
        </div>
      </div>
    </div>
  );
}
