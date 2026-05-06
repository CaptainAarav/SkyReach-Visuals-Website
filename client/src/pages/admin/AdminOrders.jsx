import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { formatOrderNumber } from '../../utils/format.js';
import { DirectInvoiceModal } from '../../components/admin/DirectInvoiceModal.jsx';

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
  EXTERNAL: 'External customer',
};

function OrderComposeModal({ order, onClose, onSent }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [cc, setCc] = useState('');
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
        cc: cc.trim() || undefined,
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

  const displaySubject = (subject || '').trim() || '(No subject)';
  const displayBody = (body || '').trim() || '(Your message will appear here)';
  const logoUrl = getLogoUrl();
  const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const previewHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>body{margin:0;padding:40px 20px;background:#F5F5F7;font-family:'Inter',Arial,sans-serif;color:#111827}.card{max-width:520px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);border:1px solid #e5e7eb;overflow:hidden}.card-inner{padding:24px}.card h1{margin:0 0 8px;font-size:20px;font-weight:600;color:#111827}.card .body{font-size:15px;line-height:1.6;color:#4b5563;white-space:pre-wrap;margin:16px 0}.card .footer{padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280}img{display:block;max-width:100%;height:auto;border-radius:4px}</style></head><body><div class="card"><div class="card-inner"><img src="${escapeHtml(logoUrl)}" alt="SkyReach Visuals" width="120" height="40"/><h1>${escapeHtml(displaySubject)}</h1><div class="body">${escapeHtml(displayBody)}</div><div class="footer">SkyReach Visuals — Drone Aerial Photography &amp; Inspection · 07877 691861</div></div></div></body></html>`;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-bg-card border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-bold text-white">Send email</h2>
          <button onClick={onClose} className="text-cream/60 hover:text-white text-xl">&times;</button>
        </div>
        <div className="flex flex-1 min-h-0 flex-col md:flex-row">
          <form onSubmit={handleSend} className="flex flex-col w-full md:w-[380px] shrink-0 p-6 space-y-4 overflow-y-auto md:border-r border-white/10">
            {err && <p className="text-sm text-red">{err}</p>}
            <div>
              <label className="block text-xs text-cream/50 mb-1">To</label>
              <p className="text-sm text-white">{order.user?.email}</p>
            </div>
            <div>
              <label className="block text-xs text-cream/50 mb-1">CC <span className="text-cream/40">(optional)</span></label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="Comma-separated emails"
                className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream placeholder:text-cream/40"
              />
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
              <button type="button" onClick={onClose} className="text-sm font-medium bg-red text-white px-4 py-2 rounded-lg hover:bg-red-dark">Cancel</button>
            </div>
          </form>
          <div className="flex flex-col flex-1 min-w-0 p-4 min-h-[240px] border-t md:border-t-0 md:border-l-0 border-gray-200" style={{ backgroundColor: '#F5F5F7' }}>
            <p className="text-xs text-gray-500 mb-2 font-medium shrink-0">Preview (as recipient will see — always light)</p>
            <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-gray-200" style={{ backgroundColor: '#F5F5F7' }}>
              <iframe title="Email preview" srcDoc={previewHtml} className="w-full min-h-[280px] border-0 rounded-xl" sandbox="allow-same-origin" />
            </div>
          </div>
        </div>
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
  const [invoiceShootDate, setInvoiceShootDate] = useState(() => {
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
        shootDate: invoiceShootDate || undefined,
      };
      const res = await fetch(`/api/admin/orders/${order.id}/invoice-preview`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Preview failed.');
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
        shootDate: invoiceShootDate || undefined,
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
                  <label className="block text-xs text-cream/50 mb-1">Shoot date</label>
                  <input type="date" value={invoiceShootDate} onChange={(e) => setInvoiceShootDate(e.target.value)} className="w-full bg-bg-card border border-white/20 rounded-lg py-2 px-3 text-sm text-cream" />
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
  const [directInvoiceOrder, setDirectInvoiceOrder] = useState(null);

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
          onDirectInvoice={() => setDirectInvoiceOrder(viewOrder)}
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

      {directInvoiceOrder && (
        <DirectInvoiceModal
          order={directInvoiceOrder}
          onClose={() => setDirectInvoiceOrder(null)}
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

function ViewOrderModal({ order, onClose, onEdit, onAccept, onSendEmail, onDirectInvoice, onDecline, onDelete, onPermanentDelete, isDeleted }) {
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
                {['PENDING', 'APPROVED'].includes(order.status) && onDirectInvoice && (
                  <button type="button" onClick={onDirectInvoice} className="text-sm font-medium bg-white/10 text-cream px-4 py-2 rounded-lg hover:bg-white/20">Send direct invoice</button>
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
