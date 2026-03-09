import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { formatOrderNumber } from '../../utils/format.js';

const statusColors = {
  PENDING: 'bg-amber-500/20 text-amber-400',
  CONFIRMED: 'bg-emerald-500/20 text-emerald-400',
  COMPLETED: 'bg-cream/20 text-cream',
  CANCELLED: 'bg-red/20 text-red',
};

function fetchBooking(id) {
  return api.get(`/api/bookings/${id}`);
}

export default function BookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: '', comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  const loadBooking = () => {
    setLoading(true);
    fetchBooking(id)
      .then(setBooking)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBooking();
  }, [id]);

  const handleSubmitReview = (e) => {
    e.preventDefault();
    setReviewError(null);
    if (!reviewForm.comment.trim()) {
      setReviewError('Comment is required');
      return;
    }
    setReviewSubmitting(true);
    api.post(`/api/bookings/${id}/review`, {
      rating: reviewForm.rating ? Number(reviewForm.rating) : undefined,
      comment: reviewForm.comment.trim(),
    })
      .then(() => {
        setReviewForm({ rating: '', comment: '' });
        loadBooking();
      })
      .catch((err) => setReviewError(err.message))
      .finally(() => setReviewSubmitting(false));
  };

  if (loading) return <LoadingSpinner />;

  const review = booking?.reviews?.[0];
  const canReview = booking?.status === 'COMPLETED' && !review;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24">
        <p className="text-red">{error}</p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm text-cream/60 hover:text-cream">
          &larr; Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-24">
      <Link to="/dashboard" className="text-sm text-cream/60 hover:text-cream transition-colors">
        &larr; Back to orders
      </Link>

      <div className="mt-8 flex items-center gap-4">
        <h1 className="text-3xl font-bold text-white">{booking.packageName}</h1>
        <span className={`text-xs font-medium px-3 py-1 rounded-lg ${statusColors[booking.status]}`}>
          {booking.status}
        </span>
      </div>

      <div className="mt-10 bg-bg-card border border-white/10 p-8 rounded-2xl space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase text-cream/50">Shoot date</span>
            <p className="mt-1 font-medium text-cream">
              {new Date(booking.shootDate).toLocaleDateString('en-GB', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase text-cream/50">Location</span>
            <p className="mt-1 font-medium text-cream">{booking.location}</p>
          </div>
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase text-cream/50">Phone</span>
            <p className="mt-1 font-medium text-cream">{booking.phone}</p>
          </div>
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase text-cream/50">Amount paid</span>
            <p className="mt-1 font-medium text-cream">£{(booking.packagePrice / 100).toFixed(2)}</p>
          </div>
        </div>

        {booking.notes && (
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase text-cream/50">Notes</span>
            <p className="mt-1 text-cream/70">{booking.notes}</p>
          </div>
        )}

        <div>
          <span className="text-xs font-semibold tracking-widest uppercase text-cream/50">Order No</span>
          <p className="mt-1 font-semibold text-cream">{formatOrderNumber(booking.orderNumber)}</p>
        </div>

        <div>
          <span className="text-xs font-semibold tracking-widest uppercase text-cream/50">Booked on</span>
          <p className="mt-1 text-sm text-cream/60">
            {new Date(booking.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {(booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') && booking.paidAt && (
        <div className="mt-6">
          <a
            href={`/api/bookings/${id}/invoice`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-accent hover:text-accent-light transition-colors"
          >
            Download invoice
          </a>
        </div>
      )}

      {canReview && (
        <div className="mt-10 bg-bg-card border border-white/10 p-8 rounded-2xl">
          <h2 className="text-xl font-semibold text-white">Leave a review</h2>
          <form onSubmit={handleSubmitReview} className="mt-6 space-y-4">
            <div>
              <label htmlFor="rating" className="block text-sm font-medium text-cream/80 mb-1">Rating (optional)</label>
              <select
                id="rating"
                value={reviewForm.rating}
                onChange={(e) => setReviewForm((f) => ({ ...f, rating: e.target.value }))}
                className="w-full max-w-[120px] bg-bg border border-white/20 rounded-xl py-2 px-3 text-cream"
              >
                <option value="">—</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n} star{n !== 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-cream/80 mb-1">Comment</label>
              <textarea
                id="comment"
                required
                rows={4}
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                className="w-full bg-bg border border-white/20 rounded-xl py-2 px-3 text-cream placeholder:text-cream/40"
                placeholder="How was your experience?"
              />
            </div>
            {reviewError && <p className="text-sm text-red">{reviewError}</p>}
            <button
              type="submit"
              disabled={reviewSubmitting}
              className="bg-red text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-red-dark transition-colors disabled:opacity-50"
            >
              {reviewSubmitting ? 'Submitting...' : 'Submit review'}
            </button>
          </form>
        </div>
      )}

      {review && (
        <div className="mt-10 bg-bg-card border border-white/10 p-8 rounded-2xl">
          <h2 className="text-xl font-semibold text-white">Your review</h2>
          {review.rating != null && (
            <p className="mt-2 text-cream/80">{review.rating} star{review.rating !== 1 ? 's' : ''}</p>
          )}
          <p className="mt-2 text-cream/80">{review.comment}</p>
          <p className="mt-4 text-xs text-cream/50">
            {new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      )}
    </div>
  );
}
