import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock.js';
import { formatOrderNumber } from '../../utils/format.js';

export default function AdminPaymentRequests() {
  const [requests, setRequests] = useState([]);
  const [approvedBookings, setApprovedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [actionReq, setActionReq] = useState(null);
  const [acceptBookingId, setAcceptBookingId] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [saving, setSaving] = useState(false);

  useBodyScrollLock(!!actionReq);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/admin/payment-requests${filter ? `?status=${filter}` : ''}`)
      .then(setRequests)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    if (actionReq?.status === 'accept') {
      api.get('/api/admin/orders?status=approved')
        .then(setApprovedBookings)
        .catch(() => setApprovedBookings([]));
    }
  }, [actionReq?.status]);

  const handleAccept = async () => {
    if (!actionReq?.id || !acceptBookingId.trim()) {
      setError('Please select a booking to link.');
      return;
    }
    setSaving(true);
    try {
      const updated = await api.patch(`/api/admin/payment-requests/${actionReq.id}`, {
        status: 'ACCEPTED',
        bookingId: acceptBookingId.trim(),
      });
      setRequests((list) => list.map((r) => (r.id === actionReq.id ? updated : r)));
      setActionReq(null);
      setAcceptBookingId('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDecline = async (req) => {
    if (!window.confirm('Decline this payment request? The customer will receive an email.')) return;
    setSaving(true);
    try {
      const updated = await api.patch(`/api/admin/payment-requests/${req.id}`, { status: 'DECLINED' });
      setRequests((list) => list.map((r) => (r.id === req.id ? updated : r)));
      setActionReq(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAdjust = async () => {
    if (!actionReq?.id) return;
    setSaving(true);
    try {
      const body = {
        status: 'ADJUSTED',
        adminNotes: adjustNotes.trim() || undefined,
        adjustedAmount: adjustAmount ? Math.round(parseFloat(adjustAmount) * 100) : undefined,
      };
      const updated = await api.patch(`/api/admin/payment-requests/${actionReq.id}`, body);
      setRequests((list) => list.map((r) => (r.id === actionReq.id ? updated : r)));
      setActionReq(null);
      setAdjustNotes('');
      setAdjustAmount('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {error && <p className="text-sm text-red mb-4">{error}</p>}
      <div className="flex flex-wrap gap-2 mb-6">
        {['pending', 'accepted', 'declined', 'adjusted'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg capitalize ${filter === s ? 'bg-accent text-white' : 'bg-bg-card text-cream/80 hover:text-white border border-white/10'}`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {requests.map((req) => (
          <div
            key={req.id}
            className="bg-bg-card border border-white/10 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4"
          >
            <div>
              <p className="font-medium text-white">{req.customerName}</p>
              <a href={`mailto:${req.customerEmail}`} className="text-sm text-cream/70 hover:text-accent">{req.customerEmail}</a>
              <p className="mt-1 text-xs text-cream/50">
                {new Date(req.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              {req.adminNotes && <p className="mt-2 text-sm text-cream/70">{req.adminNotes}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                req.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                req.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-400' :
                req.status === 'DECLINED' ? 'bg-red/20 text-red' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {req.status}
              </span>
              {req.status === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={() => setActionReq({ ...req, status: 'accept' })}
                    className="text-sm font-medium bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecline(req)}
                    disabled={saving}
                    className="text-sm font-medium bg-red/20 text-red px-3 py-1.5 rounded-lg hover:bg-red/30 disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionReq({ ...req, status: 'adjust' })}
                    className="text-sm font-medium bg-white/10 text-cream px-3 py-1.5 rounded-lg hover:bg-white/20"
                  >
                    Adjust
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {requests.length === 0 && !loading && (
        <p className="text-cream/60 py-8">No payment requests.</p>
      )}

      {actionReq?.status === 'accept' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overscroll-contain" aria-modal="true" role="presentation">
          <div className="bg-bg-card border border-white/10 rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">Accept — link to booking</h3>
            <p className="text-sm text-cream/70 mb-2">Select an approved unpaid booking to send the payment link to {actionReq.customerEmail}:</p>
            <select
              value={acceptBookingId}
              onChange={(e) => setAcceptBookingId(e.target.value)}
              className="w-full bg-black/30 border border-white/20 rounded-lg py-2 px-3 text-white mb-4"
            >
              <option value="">Select booking...</option>
              {approvedBookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {formatOrderNumber(b.orderNumber)} — {b.packageName} — {b.user?.name}
                </option>
              ))}
            </select>
            {approvedBookings.length === 0 && (
              <p className="text-sm text-amber-400 mb-4">No approved unpaid bookings. Accept a pending order first.</p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => setActionReq(null)} className="text-sm px-4 py-2 text-cream/80 hover:text-white">Cancel</button>
              <button type="button" onClick={handleAccept} disabled={saving || !acceptBookingId.trim()} className="text-sm font-medium bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                {saving ? 'Sending...' : 'Send payment link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {actionReq?.status === 'adjust' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overscroll-contain" aria-modal="true" role="presentation">
          <div className="bg-bg-card border border-white/10 rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">Adjust payment request</h3>
            <label className="block text-sm text-cream/70 mb-1">Notes (optional)</label>
            <textarea
              value={adjustNotes}
              onChange={(e) => setAdjustNotes(e.target.value)}
              rows={2}
              className="w-full bg-black/30 border border-white/20 rounded-lg py-2 px-3 text-white mb-4"
            />
            <label className="block text-sm text-cream/70 mb-1">Revised amount £ (optional)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder="e.g. 150.00"
              className="w-full bg-black/30 border border-white/20 rounded-lg py-2 px-3 text-white mb-4"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setActionReq(null)} className="text-sm px-4 py-2 text-cream/80 hover:text-white">Cancel</button>
              <button type="button" onClick={handleAdjust} disabled={saving} className="text-sm font-medium bg-accent text-white px-4 py-2 rounded-lg disabled:opacity-50">
                {saving ? 'Sending...' : 'Send update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
