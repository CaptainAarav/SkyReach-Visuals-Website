import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

export default function QuickPay() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter your email.');
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const data = await api.post('/api/bookings/quick-pay', {
        email: trimmedEmail,
        name: name.trim(),
      });
      setSuccess(data?.message || 'Request sent. We\'ll email you once your payment link is ready.');
      setName('');
      setEmail('');
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
        Request a payment link. Enter your name and email and we&rsquo;ll send you a link to pay once it&rsquo;s approved.
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
        {success && (
          <p className="text-sm text-emerald-400">{success}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red text-white font-medium py-3 px-6 rounded-xl hover:bg-red-dark transition-colors disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Request Payment'}
        </button>
      </form>
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
