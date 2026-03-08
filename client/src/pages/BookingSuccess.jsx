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
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="mt-4 text-navy/60">{error}</p>
        <p className="mt-2 text-navy/60 text-sm">
          If you&rsquo;ve been charged, don&rsquo;t worry — please contact us at
          support@skyreachvisuals.co.uk and we&rsquo;ll sort it out.
        </p>
        <Link
          to="/dashboard"
          className="mt-8 inline-block bg-navy text-cream text-sm font-medium px-8 py-3 hover:bg-navy-light transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-24">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-navy/10 mb-6">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-navy">
            <path d="M6 16l7 7L26 9" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold">Booking confirmed</h1>
        <p className="mt-3 text-navy/60">
          Thanks for booking with SkyReach Visuals. We&rsquo;ll be in touch to
          confirm the final details of your shoot.
        </p>
      </div>

      {booking && (
        <div className="mt-10 bg-cream-dark p-6 space-y-4">
          <div className="flex justify-between">
            <span className="text-sm text-navy/60">Package</span>
            <span className="text-sm font-medium">{booking.packageName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-navy/60">Date</span>
            <span className="text-sm font-medium">
              {new Date(booking.shootDate).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-navy/60">Location</span>
            <span className="text-sm font-medium">{booking.location}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-navy/60">Amount paid</span>
            <span className="text-sm font-medium">
              £{(booking.packagePrice / 100).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          to="/dashboard"
          className="inline-block bg-navy text-cream text-sm font-medium px-8 py-3 hover:bg-navy-light transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
