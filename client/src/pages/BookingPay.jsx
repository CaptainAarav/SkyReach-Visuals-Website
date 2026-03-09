import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { formatOrderNumber } from '../utils/format.js';

const TIME_WINDOWS = [
  { value: 'Morning (8am–12pm)', label: 'Morning (8am–12pm)' },
  { value: 'Afternoon (12pm–5pm)', label: 'Afternoon (12pm–5pm)' },
  { value: 'Evening (5pm–8pm)', label: 'Evening (5pm–8pm)' },
  { value: 'Custom', label: 'Custom' },
];

export default function BookingPay() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);
  const [editingTime, setEditingTime] = useState(false);
  const [newTime, setNewTime] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [savingTime, setSavingTime] = useState(false);

  useEffect(() => {
    api.get(`/api/bookings/${bookingId}`)
      .then(setBooking)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handleSaveTime = async () => {
    const timeValue = newTime === 'Custom' ? customTime : newTime;
    if (!timeValue) return;
    setSavingTime(true);
    try {
      const data = await api.patch(`/api/bookings/${bookingId}/time`, { shootTime: timeValue });
      setBooking(data);
      setEditingTime(false);
      setNewTime('');
      setCustomTime('');
    } catch (err) {
      setPayError(err.message);
    } finally {
      setSavingTime(false);
    }
  };

  const handlePay = async () => {
    setPaying(true);
    setPayError(null);
    try {
      const data = await api.post(`/api/bookings/${bookingId}/pay`);
      window.location.href = data.sessionUrl;
    } catch (err) {
      setPayError(err.message);
      setPaying(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <h1 className="text-3xl font-bold text-white">Something went wrong</h1>
        <p className="mt-4 text-cream/60">{error}</p>
        <Link
          to="/orders"
          className="mt-8 inline-block bg-red text-white text-sm font-medium px-8 py-3 rounded-xl hover:bg-red-dark transition-colors"
        >
          View your orders
        </Link>
      </div>
    );
  }

  if (!booking) return null;

  if (booking.status !== 'APPROVED') {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <h1 className="text-3xl font-bold text-white">Payment Not Available</h1>
        <p className="mt-4 text-cream/60">
          {booking.status === 'CONFIRMED'
            ? 'This booking has already been paid for.'
            : booking.status === 'PENDING'
              ? 'This booking is still awaiting approval.'
              : `This booking is currently ${booking.status.toLowerCase()}.`}
        </p>
        <Link
          to="/orders"
          className="mt-8 inline-block bg-red text-white text-sm font-medium px-8 py-3 rounded-xl hover:bg-red-dark transition-colors"
        >
          View your orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-24">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white">Complete Your Payment</h1>
        <p className="mt-3 text-cream/70">
          Your booking has been approved. Review the details below and proceed to pay.
        </p>
      </div>

      <div className="bg-bg-card border border-white/10 rounded-2xl p-8 space-y-5">
        {booking.orderNumber != null && (
          <div className="flex justify-between">
            <span className="text-sm text-cream/60">Order No</span>
            <span className="text-sm font-semibold text-white">{formatOrderNumber(booking.orderNumber)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-sm text-cream/60">Service</span>
          <span className="text-sm font-medium text-white">{booking.packageName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-cream/60">Date</span>
          <span className="text-sm font-medium text-white">
            {new Date(booking.shootDate).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </span>
        </div>
        <div>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <span className="text-sm text-cream/60">Shoot time</span>
            {!editingTime ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{booking.shootTime || 'Not set'}</span>
                <button
                  type="button"
                  onClick={() => { setEditingTime(true); setNewTime(booking.shootTime || ''); }}
                  className="text-xs font-medium text-accent hover:text-accent-light transition-colors underline"
                >
                  Adjust shoot time
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={TIME_WINDOWS.some((tw) => tw.value === newTime) ? newTime : (newTime ? 'Custom' : '')}
                  onChange={(e) => { setNewTime(e.target.value); if (e.target.value !== 'Custom') setCustomTime(''); }}
                  className="bg-bg border border-white/20 rounded-lg py-1 px-2 text-sm text-cream"
                >
                  <option value="">Select...</option>
                  {TIME_WINDOWS.map((tw) => (
                    <option key={tw.value} value={tw.value}>{tw.label}</option>
                  ))}
                </select>
                {newTime === 'Custom' && (
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="bg-bg border border-white/20 rounded-lg py-1 px-2 text-sm text-cream"
                  />
                )}
                <button
                  type="button"
                  onClick={handleSaveTime}
                  disabled={savingTime || (!newTime || (newTime === 'Custom' && !customTime))}
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                >
                  {savingTime ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingTime(false); setNewTime(''); setCustomTime(''); }}
                  className="text-xs text-cream/50 hover:text-cream"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-cream/60">Location</span>
          <span className="text-sm font-medium text-white">{booking.location}</span>
        </div>
        <div className="border-t border-white/10 pt-5 flex justify-between">
          <span className="text-sm font-semibold text-white">Total</span>
          <span className="text-2xl font-bold text-white">
            &pound;{(booking.packagePrice / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {payError && (
        <p className="mt-4 text-sm text-red text-center">{payError}</p>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={handlePay}
          disabled={paying}
          className="bg-red text-white text-sm font-medium px-10 py-4 rounded-xl hover:bg-red-dark transition-colors disabled:opacity-50"
        >
          {paying ? 'Redirecting to payment...' : `Pay £${(booking.packagePrice / 100).toFixed(2)}`}
        </button>
        <p className="mt-3 text-xs text-cream/40">
          You&rsquo;ll be redirected to Stripe to complete payment securely.
        </p>
      </div>
    </div>
  );
}
