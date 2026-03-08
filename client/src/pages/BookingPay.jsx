import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function BookingPay() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState(null);

  useEffect(() => {
    api.get(`/api/bookings/${bookingId}`)
      .then(setBooking)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [bookingId]);

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
        {booking.shootTime && (
          <div className="flex justify-between">
            <span className="text-sm text-cream/60">Time</span>
            <span className="text-sm font-medium text-white">{booking.shootTime}</span>
          </div>
        )}
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
