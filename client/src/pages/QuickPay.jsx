import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client.js';

export default function QuickPay() {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = orderNumber.trim();
    if (!trimmed) {
      setError('Please enter your order number.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await api.get(`/api/bookings/by-order/${encodeURIComponent(trimmed)}`);
      navigate(`/booking/pay/${data.bookingId}`, { replace: true });
    } catch (err) {
      setError(err.message || 'No approved booking found for this order number.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold text-white">Already discussed a project?</h1>
      <p className="mt-3 text-cream/70">
        Enter your order number below to complete payment. You&rsquo;ll need to be logged in to pay.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="orderNumber" className="block text-sm font-medium text-cream/80 mb-2">
            Order number
          </label>
          <input
            id="orderNumber"
            type="text"
            inputMode="numeric"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.replace(/\D/g, ''))}
            placeholder="e.g. 5266"
            className="w-full bg-bg-card border border-white/20 rounded-xl py-3 px-4 text-white placeholder:text-cream/40 focus:border-accent outline-none transition-colors"
          />
        </div>
        {error && (
          <p className="text-sm text-red">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red text-white font-medium py-3 px-6 rounded-xl hover:bg-red-dark transition-colors disabled:opacity-50"
        >
          {loading ? 'Looking up...' : 'Go to payment'}
        </button>
      </form>
      <p className="mt-6 text-sm text-cream/50">
        Don&rsquo;t have an order number?{' '}
        <Link to="/get-started" className="text-accent hover:text-accent-light transition-colors">
          Make a booking
        </Link>{' '}
        or{' '}
        <Link to="/quote" className="text-accent hover:text-accent-light transition-colors">
          get a quote
        </Link>.
      </p>
    </div>
  );
}
