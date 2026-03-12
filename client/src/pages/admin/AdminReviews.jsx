import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [togglingMain, setTogglingMain] = useState(null);

  const setShowOnMainPage = (id, showOnMainPage) => {
    setTogglingMain(id);
    api.patch(`/api/admin/reviews/${id}`, { showOnMainPage })
      .then(() => setReviews((list) => list.map((r) => (r.id === id ? { ...r, showOnMainPage } : r))))
      .catch((err) => setError(err.message))
      .finally(() => setTogglingMain(null));
  };

  useEffect(() => {
    api.get('/api/admin/reviews')
      .then(setReviews)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const removeReview = (id) => {
    if (!window.confirm('Remove this review?')) return;
    setDeleting(id);
    api.delete('/api/reviews/' + id)
      .then(() => setReviews((list) => list.filter((r) => r.id !== id)))
      .catch((err) => setError(err.message))
      .finally(() => setDeleting(null));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {error && <p className="text-sm text-red mb-4">{error}</p>}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-bg-card border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-white">{review.user?.name}</p>
                <p className="text-sm text-cream/60">{review.user?.email}</p>
                <p className="mt-2 text-sm text-cream/70">
                  Order: {review.booking?.packageName}
                  {review.booking?.shootDate && ` · ${new Date(review.booking.shootDate).toLocaleDateString('en-GB')}`}
                </p>
                {review.showOnMainPage && (
                  <p className="mt-1 text-xs text-emerald-400">On main page</p>
                )}
                {review.rating != null && (
                  <p className="mt-1 text-sm text-cream/60">{review.rating} star{review.rating !== 1 ? 's' : ''}</p>
                )}
                <p className="mt-3 text-cream/80">{review.comment}</p>
                <p className="mt-2 text-xs text-cream/50">
                  {new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowOnMainPage(review.id, !review.showOnMainPage)}
                  disabled={togglingMain === review.id}
                  className={`text-sm font-medium shrink-0 disabled:opacity-50 ${review.showOnMainPage ? 'text-cream/70 hover:text-cream' : 'text-accent hover:text-accent-light'}`}
                >
                  {togglingMain === review.id ? 'Updating...' : review.showOnMainPage ? 'Remove from main page' : 'Add to main page'}
                </button>
                <button
                  type="button"
                  onClick={() => removeReview(review.id)}
                  disabled={deleting === review.id}
                  className="text-sm font-medium text-red hover:text-red-dark shrink-0 disabled:opacity-50"
                >
                  {deleting === review.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {reviews.length === 0 && !loading && (
        <p className="text-cream/60 py-8">No reviews yet.</p>
      )}
    </div>
  );
}
