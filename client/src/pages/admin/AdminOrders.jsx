import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { formatOrderNumber } from '../../utils/format.js';

const statusOptions = ['PENDING', 'APPROVED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'DECLINED'];
const statusColors = {
  PENDING: 'bg-amber-500/20 text-amber-400',
  APPROVED: 'bg-blue-500/20 text-blue-400',
  CONFIRMED: 'bg-teal-500/20 text-teal-400',
  COMPLETED: 'bg-emerald-500/20 text-emerald-400',
  CANCELLED: 'bg-red/20 text-red',
  DECLINED: 'bg-red/20 text-red-400',
};

const sourceLabels = {
  QUOTE: 'Get a quote',
  BOOKING: 'Booking request',
  QUICK_PAY: 'Quick pay',
};

function OrderComposeModal({ order, onClose, onSent }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    setErr(null);
    try {
      await api.post('/api/admin/messages/send', {
        recipientEmail: order.user?.email,
        subject: subject.trim(),
        body: body.trim(),
      });
      onSent?.();
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-bg-card border border-white/10 rounded-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Send email</h2>
          <button onClick={onClose} className="text-cream/60 hover:text-white text-xl">&times;</button>
        </div>
        <form onSubmit={handleSend} className="p-6 space-y-4">
          {err && <p className="text-sm text-red">{err}</p>}
          <div>
            <label className="block text-xs text-cream/50 mb-1">To</label>
            <p className="text-sm text-white">{order.user?.email}</p>
          </div>
          <div>
            <label className="block text-xs text-cream/50 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-cream/50 mb-1">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream resize-none"
              required
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={sending} className="text-sm font-medium bg-accent text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">Send</button>
            <button type="button" onClick={onClose} className="text-sm text-cream/60 hover:text-white px-4 py-2">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ApproveModal({ order, onClose, onSave }) {
  const [quotedPrice, setQuotedPrice] = useState(
    order.packagePrice ? (order.packagePrice / 100).toFixed(2) : ''
  );
  const [adminNotes, setAdminNotes] = useState(order.adminNotes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showInvoiceEditor, setShowInvoiceEditor] = useState(false);
  const [invoiceCustomerName, setInvoiceCustomerName] = useState(order.user?.name || '');
  const [invoiceCustomerEmail, setInvoiceCustomerEmail] = useState(order.user?.email || '');
  const [invoiceServiceName, setInvoiceServiceName] = useState(order.packageName || '');
  const [invoiceLocation, setInvoiceLocation] = useState(order.location || '');
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const d = order.shootDate ? new Date(order.shootDate) : new Date();
    return d.toISOString().slice(0, 10);
  });

  const handlePreviewInvoice = async () => {
    const priceNum = parseFloat(quotedPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Enter a valid price first to preview the invoice.');
      return;
    }
    setError(null);
    setLoadingPreview(true);
    try {
      const body = {
        quotedPrice: quotedPrice.trim(),
        customerName: invoiceCustomerName.trim(),
        customerEmail: invoiceCustomerEmail.trim(),
        serviceName: invoiceServiceName.trim(),
        location: invoiceLocation.trim(),
        invoiceDate: invoiceDate || undefined,
      };
      const res = await fetch(`/api/admin/orders/${order.id}/invoice-preview`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(res.status === 503 ? 'Invoice template not available.' : 'Preview failed.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const closePreview = () => {
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
  };

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
      body.invoiceOverrides = {
        customerName: invoiceCustomerName.trim() || undefined,
        customerEmail: invoiceCustomerEmail.trim() || undefined,
        serviceName: invoiceServiceName.trim() || undefined,
        location: invoiceLocation.trim() || undefined,
        invoiceDate: invoiceDate || undefined,
      };
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
          <h2 className="text-lg font-bold text-white">{(order.source === 'QUOTE' || order.source === 'QUICK_PAY') ? 'Send invoice' : 'Approve Booking'}</h2>
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
              The customer will be charged this amount. An email with a payment link and invoice PDF will be sent.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setShowInvoiceEditor(!showInvoiceEditor)}
              className="text-sm font-medium text-cream/70 hover:text-white"
            >
              {showInvoiceEditor ? 'Hide invoice details' : 'Edit invoice details'}
            </button>
            {showInvoiceEditor && (
              <div className="mt-3 p-4 bg-bg rounded-lg border border-white/10 space-y-3">
                <div>
                  <label className="block text-xs text-cream/50 mb-1">Customer name</label>
                  <input type="text" value={invoiceCustomerName} onChange={(e) => setInvoiceCustomerName(e.target.value)} className="w-full bg-bg-card border border-white/20 rounded-lg py-2 px-3 text-sm text-cream" />
                </div>
                <div>
                  <label className="block text-xs text-cream/50 mb-1">Customer email</label>
                  <input type="email" value={invoiceCustomerEmail} onChange={(e) => setInvoiceCustomerEmail(e.target.value)} className="w-full bg-bg-card border border-white/20 rounded-lg py-2 px-3 text-sm text-cream" />
                </div>
                <div>
                  <label className="block text-xs text-cream/50 mb-1">Service name</label>
                  <input type="text" value={invoiceServiceName} onChange={(e) => setInvoiceServiceName(e.target.value)} className="w-full bg-bg-card border border-white/20 rounded-lg py-2 px-3 text-sm text-cream" />
                </div>
                <div>
                  <label className="block text-xs text-cream/50 mb-1">Location</label>
                  <input type="text" value={invoiceLocation} onChange={(e) => setInvoiceLocation(e.target.value)} className="w-full bg-bg-card border border-white/20 rounded-lg py-2 px-3 text-sm text-cream" />
                </div>
                <div>
                  <label className="block text-xs text-cream/50 mb-1">Invoice date</label>
                  <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="w-full bg-bg-card border border-white/20 rounded-lg py-2 px-3 text-sm text-cream" />
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePreviewInvoice}
              disabled={loadingPreview || !quotedPrice || parseFloat(quotedPrice) <= 0}
              className="text-sm font-medium bg-white/10 text-cream px-4 py-2 rounded-lg hover:bg-white/20 disabled:opacity-50"
            >
              {loadingPreview ? 'Loading...' : 'Preview invoice'}
            </button>
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
              {saving ? 'Sending...' : ((order.source === 'QUOTE' || order.source === 'QUICK_PAY') ? 'Set amount & send invoice' : 'Approve & Send Payment Link')}
            </button>
            <button type="button" onClick={onClose} className="text-sm text-cream/60 hover:text-white px-4 py-2">
              Cancel
            </button>
          </div>
        </form>
      </div>

      {previewPdfUrl && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/80 p-4" onClick={closePreview}>
          <div className="bg-bg-card border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
              <h3 className="text-lg font-bold text-white">Invoice preview</h3>
              <button type="button" onClick={closePreview} className="text-cream/60 hover:text-white text-xl">&times;</button>
            </div>
            <iframe src={previewPdfUrl} title="Invoice preview" className="w-full flex-1 min-h-[70vh] rounded-b-2xl bg-white" />
          </div>
        </div>
      )}
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
  { label: 'Deleted', value: 'deleted' },
];

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [approvingOrder, setApprovingOrder] = useState(null);

  const [viewOrder, setViewOrder] = useState(null);
  const [composeOrder, setComposeOrder] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) {
      if (statusFilter === 'deleted') params.set('deleted', '1');
      else params.set('status', statusFilter);
    }
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
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/20">
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Order</th>
              <th className="pb-3 pr-4 text-xs font-semibold uppercase text-cream/60">Type</th>
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
                  <span className="text-xs font-medium text-cream/80">
                    {sourceLabels[order.source] ?? 'Booking'}
                  </span>
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
          onSendEmail={() => setComposeOrder(viewOrder)}
          onDecline={async () => { await declineOrder(viewOrder.id); setViewOrder(null); }}
          onDelete={async () => {
            try {
              await api.delete(`/api/admin/orders/${viewOrder.id}`);
              setOrders((list) => list.filter((o) => o.id !== viewOrder.id));
              setViewOrder(null);
            } catch (err) { setError(err.message); }
          }}
          onPermanentDelete={async () => {
            if (!window.confirm('Are you sure you want to permanently delete this order? This cannot be undone.')) return;
            try {
              await api.delete(`/api/admin/orders/${viewOrder.id}/permanent`);
              setOrders((list) => list.filter((o) => o.id !== viewOrder.id));
              setViewOrder(null);
            } catch (err) { setError(err.message); }
          }}
          isDeleted={statusFilter === 'deleted'}
          onSave={handleEditSave}
        />
      )}

      {composeOrder && (
        <OrderComposeModal
          order={composeOrder}
          onClose={() => setComposeOrder(null)}
          onSent={() => {}}
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

function ViewOrderModal({ order, onClose, onEdit, onAccept, onSendEmail, onDecline, onDelete, onPermanentDelete, isDeleted }) {
  const isQuoteOrQuickPay = order.source === 'QUOTE' || order.source === 'QUICK_PAY';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-bg-card border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Order {order.orderNumber != null ? formatOrderNumber(order.orderNumber) : ''}{isDeleted ? ' (Deleted)' : ''}</h2>
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
          {order.location && (
            <div>
              <p className="text-xs text-cream/50 mb-1">Location</p>
              <p className="text-sm text-white">{order.location}</p>
            </div>
          )}
          {order.notes && (
            <div>
              <p className="text-xs text-cream/50 mb-1">Details / Message</p>
              <p className="text-sm text-cream/90 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
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
            {!isDeleted && (
              <>
                {order.status === 'PENDING' && (
                  <>
                    <button type="button" onClick={onAccept} className="text-sm font-medium bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
                      {isQuoteOrQuickPay ? 'Send invoice' : 'Accept'}
                    </button>
                    <button type="button" onClick={onDecline} className="text-sm font-medium bg-red/80 text-white px-4 py-2 rounded-lg hover:bg-red">Decline</button>
                  </>
                )}
                {onSendEmail && (
                  <button type="button" onClick={onSendEmail} className="text-sm font-medium bg-white/10 text-cream px-4 py-2 rounded-lg hover:bg-white/20">Send email</button>
                )}
                <button type="button" onClick={onEdit} className="text-sm font-medium bg-white/10 text-cream px-4 py-2 rounded-lg hover:bg-white/20">Edit Booking</button>
                {onDelete && (
                  <button type="button" onClick={onDelete} className="text-sm font-medium bg-red/20 text-red px-4 py-2 rounded-lg hover:bg-red/30">Delete Order</button>
                )}
              </>
            )}
            {isDeleted && onPermanentDelete && (
              <button type="button" onClick={onPermanentDelete} className="text-sm font-medium bg-red/20 text-red px-4 py-2 rounded-lg hover:bg-red/30">Permanently Delete</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
