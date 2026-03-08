import { useParams, Navigate } from 'react-router-dom';
import { getPackageBySlug } from '../data/packages.js';
import { useForm } from '../hooks/useForm.js';
import { api } from '../api/client.js';

export default function BookingCheckout() {
  const { packageSlug } = useParams();
  const pkg = getPackageBySlug(packageSlug);

  const { values, errors, submitting, submitError, handleChange, handleSubmit } = useForm({
    initialValues: { shootDate: '', location: '', phone: '', notes: '' },
    validate: (vals) => {
      const errs = {};
      if (!vals.shootDate) errs.shootDate = 'Preferred date is required';
      if (!vals.location.trim()) errs.location = 'Location is required';
      if (!vals.phone.trim()) errs.phone = 'Phone number is required';
      return errs;
    },
    onSubmit: async (vals) => {
      const data = await api.post('/api/bookings', {
        packageSlug,
        ...vals,
      });
      window.location.href = data.sessionUrl;
    },
  });

  if (!pkg) return <Navigate to="/services" replace />;

  return (
    <div className="max-w-4xl mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold">Book your shoot</h1>

      {/* Package summary */}
      <div className="mt-8 bg-navy text-cream p-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{pkg.name}</h2>
          <p className="text-cream/60 text-sm mt-1">
            {pkg.duration} &middot; {pkg.locations}
          </p>
        </div>
        <span className="text-3xl font-bold">£{pkg.displayPrice}</span>
      </div>

      {/* Booking form */}
      <form onSubmit={handleSubmit} className="mt-12 space-y-6 max-w-xl">
        <div>
          <label htmlFor="shootDate" className="block text-sm font-medium mb-2">
            Preferred shoot date
          </label>
          <input
            id="shootDate"
            name="shootDate"
            type="date"
            value={values.shootDate}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            className="w-full bg-transparent border-b-2 border-navy/20 focus:border-navy outline-none py-2 transition-colors"
          />
          {errors.shootDate && <p className="mt-1 text-xs text-red">{errors.shootDate}</p>}
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium mb-2">
            Shoot location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            placeholder="e.g. Sandbanks, Bournemouth"
            value={values.location}
            onChange={handleChange}
            className="w-full bg-transparent border-b-2 border-navy/20 focus:border-navy outline-none py-2 transition-colors placeholder:text-navy/30"
          />
          {errors.location && <p className="mt-1 text-xs text-red">{errors.location}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-2">
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={values.phone}
            onChange={handleChange}
            className="w-full bg-transparent border-b-2 border-navy/20 focus:border-navy outline-none py-2 transition-colors"
          />
          {errors.phone && <p className="mt-1 text-xs text-red">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-2">
            Notes <span className="text-navy/40">(optional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="Any specific requirements or details about the shoot"
            value={values.notes}
            onChange={handleChange}
            className="w-full bg-transparent border-b-2 border-navy/20 focus:border-navy outline-none py-2 transition-colors resize-none placeholder:text-navy/30"
          />
        </div>

        {submitError && (
          <p className="text-sm text-red">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-red text-white text-sm font-medium px-8 py-3 hover:bg-red-dark transition-colors disabled:opacity-50"
        >
          {submitting ? 'Processing...' : `Pay £${pkg.displayPrice} and book`}
        </button>

        <p className="text-xs text-navy/40">
          You&rsquo;ll be redirected to Stripe to complete payment securely.
        </p>
      </form>
    </div>
  );
}
