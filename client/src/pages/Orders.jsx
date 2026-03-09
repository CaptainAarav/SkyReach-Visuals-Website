import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const statusColors = {
  PENDING: 'bg-amber-500/20 text-amber-400',
  APPROVED: 'bg-blue-500/20 text-blue-400',
  CONFIRMED: 'bg-emerald-500/20 text-emerald-400',
  COMPLETED: 'bg-cream/20 text-cream',
  CANCELLED: 'bg-red/20 text-red',
  DECLINED: 'bg-red/20 text-red-400',
};

const statusLabels = {
  PENDING: 'Request Pending',
  APPROVED: 'Approved — Pay Now',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DECLINED: 'Declined',
};

export default function Orders() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/bookings')
      .then(setBookings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold text-white">Orders</h1>

      {error && <p className="mt-4 text-sm text-red">{error}</p>}

      {bookings.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-cream/70">No orders yet.</p>
          <Link
            to="/#services"
            className="mt-4 inline-block text-sm font-medium text-accent border-b-2 border-accent pb-1 hover:text-red hover:border-red transition-colors"
          >
            Browse services
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {bookings.map((booking) => {
            const review = booking.reviews?.[0];
            const canReview = booking.status === 'COMPLETED' && !review;
            return (
              <div
                key={booking.id}
                className="block bg-bg-card border border-white/10 p-6 rounded-2xl"
              >
                <Link to={`/dashboard/bookings/${booking.id}`} className="block">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{booking.packageName}</h3>
                      <p className="text-sm text-cream/60 mt-1">
                        {new Date(booking.shootDate).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                        {' '}&middot;{' '}{booking.location}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-lg ${statusColors[booking.status] || 'bg-white/10 text-cream'}`}>
                      {statusLabels[booking.status] || booking.status}
                    </span>
                  </div>
                </Link>
                {booking.status === 'APPROVED' && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <Link
                      to={`/booking/pay/${booking.id}`}
                      className="inline-block text-sm font-medium bg-red text-white px-6 py-2 rounded-xl hover:bg-red-dark transition-colors"
                    >
                      Pay &pound;{(booking.packagePrice / 100).toFixed(2)}
                    </Link>
                  </div>
                )}
                {canReview && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <Link
                      to={`/dashboard/bookings/${booking.id}`}
                      className="inline-flex items-center gap-2 text-sm font-medium bg-amber-500/10 text-amber-400 px-5 py-2.5 rounded-xl hover:bg-amber-500/20 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Leave a Review
                    </Link>
                  </div>
                )}
                {review && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-cream/50 uppercase tracking-wider">Your review</p>
                    <p className="mt-1 text-cream/80 text-sm">{review.comment}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
