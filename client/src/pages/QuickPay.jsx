import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client.js';

export default function QuickPay() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter your email.');
      return;
    }
    setError(null);
    setBookings(null);
    setLoading(true);
    try {
      const data = await api.post('/api/bookings/by-customer', { email: trimmedEmail, name: name.trim() });
      if (!data || data.length === 0) {
        setError('No approved unpaid bookings found for this email.');
      } else if (data.length === 1) {
        navigate(`/booking/pay/${data[0].id}`, { replace: true });
      } else {
        setBookings(data);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold text-white">Already discussed a project?</h1>
      <p className="mt-3 text-cream/70">
        Enter your name and email to find your approved booking and complete payment. You&rsquo;ll need to be logged in to pay.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-cream/80 mb-2">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-bg-card border border-white/20 rounded-xl py-3 px-4 text-white placeholder:text-cream/40 focus:border-accent outline-none transition-colors"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-cream/80 mb-2">
            Email <span className="text-red">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full bg-bg-card border border-white/20 rounded-xl py-3 px-4 text-white placeholder:text-cream/40 focus:border-accent outline-none transition-colors"
            required
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
          {loading ? 'Looking up...' : 'Find my booking'}
        </button>
      </form>
      {bookings && bookings.length > 1 && (
        <div className="mt-6 space-y-2">
          <p className="text-sm text-cream/80 font-medium">Select a booking to pay:</p>
          {bookings.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => navigate(`/booking/pay/${b.id}`, { replace: true })}
              className="w-full text-left bg-bg-card border border-white/20 rounded-xl py-3 px-4 text-white hover:border-red/40 transition-colors"
            >
              <span className="font-medium">{b.packageName}</span>
              <span className="text-cream/60 text-sm block mt-0.5">
                &pound;{(b.packagePrice / 100).toFixed(2)} &middot; {b.shootDate ? new Date(b.shootDate).toLocaleDateString('en-GB') : ''}
              </span>
            </button>
          ))}
        </div>
      )}
      <p className="mt-6 text-sm text-cream/50">
        Don&rsquo;t have a booking yet?{' '}
        <Link to="/book" className="text-accent hover:text-accent-light transition-colors">
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
