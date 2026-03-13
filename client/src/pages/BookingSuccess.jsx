import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found');
      setLoading(false);
      return;
    }

    api.get(`/api/bookings/verify?session_id=${sessionId}`)
      .then(setBooking)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center bg-gray-50 min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
        <p className="mt-4 text-gray-600">{error}</p>
        <p className="mt-2 text-gray-500 text-sm">
          If you&rsquo;ve been charged, don&rsquo;t worry — contact us at support@skyreachvisuals.co.uk and we&rsquo;ll sort it out.
        </p>
        <Link to="/dashboard" className="mt-8 inline-block bg-gray-800 text-white text-sm font-medium px-8 py-3 rounded-lg hover:bg-gray-900">
          Go to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-24 bg-gray-50 min-h-screen">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-lg mb-6">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-700">
            <path d="M6 16l7 7L26 9" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Booking confirmed</h1>
        <p className="mt-3 text-gray-600">
          Thanks for booking with SkyReach Visuals. We&rsquo;ll be in touch to confirm the final details of your shoot.
        </p>
      </div>

      {booking && (
        <div className="mt-10 bg-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Package</span>
            <span className="font-medium text-gray-900">{booking.packageName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date</span>
            <span className="font-medium text-gray-900">
              {new Date(booking.shootDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Location</span>
            <span className="font-medium text-gray-900">{booking.location || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount paid</span>
            <span className="font-medium text-gray-900">£{(booking.packagePrice / 100).toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          to="/dashboard"
          className="inline-block bg-gray-800 text-white text-sm font-medium px-8 py-3 rounded-lg hover:bg-gray-900 transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
