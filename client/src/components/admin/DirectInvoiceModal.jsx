import { useState } from 'react';
import { api } from '../../api/client.js';

/**
 * @param {{ order?: object | null, onClose: () => void, variant?: 'order' | 'external', onSent?: () => void, embedded?: boolean }} props
 * - order: required when variant is `order` and not embedded
 * - external: creates a PENDING booking and sends invoice via admin API
 * - embedded: render form only (for External Customer modal tab)
 */
export function DirectInvoiceModal({ order, onClose, variant = 'order', onSent, embedded = false }) {
  const isExternal = variant === 'external';

  const [quotedPrice, setQuotedPrice] = useState(() =>
    isExternal ? '' : order?.packagePrice ? (order.packagePrice / 100).toFixed(2) : ''
  );
  const [customerName, setCustomerName] = useState(() => (isExternal ? '' : order?.user?.name || ''));
  const [customerEmail, setCustomerEmail] = useState(() => (isExternal ? '' : order?.user?.email || ''));
  const [ccEmails, setCcEmails] = useState('');
  const [serviceName, setServiceName] = useState(() => (isExternal ? '' : order?.packageName || ''));
  const [location, setLocation] = useState(() => (isExternal ? '' : order?.location || ''));
  const [shootDate, setShootDate] = useState(() =>
    isExternal ? '' : order?.shootDate ? new Date(order.shootDate).toISOString().slice(0, 10) : ''
  );
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const d =
      !isExternal && order?.shootDate ? new Date(order.shootDate) : new Date();
    return d.toISOString().slice(0, 10);
  });
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

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
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        serviceName: serviceName.trim(),
        location: location.trim(),
        invoiceDate: invoiceDate || undefined,
        shootDate: shootDate || undefined,
      };
      const url = isExternal
        ? '/api/admin/invoice-preview-draft'
        : `/api/admin/orders/${order.id}/invoice-preview`;
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Preview failed.');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPreviewPdfUrl(blobUrl);
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
    setError(null);
    const priceNum = parseFloat(quotedPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price');
      return;
    }
    if (!customerEmail.trim()) {
      setError('Recipient email is required');
      return;
    }
    setSending(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        ccEmails: ccEmails.trim() || undefined,
        serviceName: serviceName.trim(),
        location: location.trim(),
        shootDate: shootDate || undefined,
        invoiceDate: invoiceDate || undefined,
        quotedPrice: quotedPrice.trim(),
        paymentMethod,
      };
      if (isExternal) {
        await api.post('/api/admin/external-customer-direct-invoice', payload);
      } else {
        await api.post(`/api/admin/orders/${order.id}/send-direct-invoice`, payload);
      }
      onSent?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const formBody = (
        <form onSubmit={handleSubmit} className={`${embedded ? '' : 'p-6'} space-y-4`}>
          {error && <p className="text-sm text-red">{error}</p>}
          {isExternal ? (
            <p className="text-xs text-cream/50">
              Creates a pending order and sends the invoice. It appears under Orders and Transactions. Stripe completes automatically when the customer pays; for bank transfer, mark the order completed when you have received payment.
            </p>
          ) : (
            <p className="text-xs text-cream/50">
              Order must be pending or approved. The recipient receives your branding, invoice PDF, and either a Stripe pay link or bank details — not both.
            </p>
          )}
          <div>
            <label className="block text-xs text-cream/50 mb-1">Customer name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-cream/50 mb-1">Email</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-cream/50 mb-1">
              CC <span className="text-cream/40">(optional)</span>
            </label>
            <textarea
              value={ccEmails}
              onChange={(e) => setCcEmails(e.target.value)}
              placeholder="Comma-separated emails"
              rows={2}
              className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream resize-none placeholder:text-cream/40"
            />
          </div>
          <div>
            <label className="block text-xs text-cream/50 mb-1">Service</label>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-cream/50 mb-1">Shoot date</label>
            <input
              type="date"
              value={shootDate}
              onChange={(e) => setShootDate(e.target.value)}
              className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream"
            />
          </div>
          <div>
            <label className="block text-xs text-cream/50 mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream"
            />
          </div>
          <div>
            <label className="block text-xs text-cream/50 mb-1">Invoice date</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream"
            />
          </div>
          <div>
            <label className="block text-xs text-cream/50 mb-1">Amount (&pound;)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={quotedPrice}
              onChange={(e) => setQuotedPrice(e.target.value)}
              className="w-full bg-bg border border-white/20 rounded-lg py-2 px-3 text-sm text-cream"
              required
            />
          </div>
          <div>
            <p className="block text-xs text-cream/50 mb-2">Payment</p>
            <div className="flex rounded-lg overflow-hidden border border-white/20">
              <button
                type="button"
                onClick={() => setPaymentMethod('stripe')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  paymentMethod === 'stripe' ? 'bg-accent text-white' : 'bg-bg text-cream/70 hover:text-white'
                }`}
              >
                Stripe Pay
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  paymentMethod === 'bank_transfer' ? 'bg-accent text-white' : 'bg-bg text-cream/70 hover:text-white'
                }`}
              >
                Bank transfer
              </button>
            </div>
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
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={sending}
              className="bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {sending ? 'Sending…' : 'Send invoice email'}
            </button>
            <button type="button" onClick={onClose} className="text-sm text-cream/60 hover:text-white px-4 py-2">
              Cancel
            </button>
          </div>
        </form>
  );

  const previewLayer =
      previewPdfUrl && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4" onClick={closePreview}>
          <div
            className="bg-bg-card border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
              <h3 className="text-lg font-bold text-white">Invoice preview</h3>
              <button type="button" onClick={closePreview} className="text-cream/60 hover:text-white text-xl">
                &times;
              </button>
            </div>
            <iframe src={previewPdfUrl} title="Invoice preview" className="w-full flex-1 min-h-[70vh] rounded-b-2xl bg-white" />
          </div>
        </div>
      );

  if (embedded) {
    return (
      <>
        {formBody}
        {previewLayer}
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div
        className="bg-bg-card border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Send direct invoice</h2>
          <button type="button" onClick={onClose} className="text-cream/60 hover:text-white text-xl">
            &times;
          </button>
        </div>
        {formBody}
      </div>

      {previewLayer}
    </div>
  );
}
