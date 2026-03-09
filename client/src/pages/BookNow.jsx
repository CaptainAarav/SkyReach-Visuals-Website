import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from '../hooks/useForm.js';
import { api } from '../api/client.js';
import { SERVICES } from '../data/packages.js';

const POSTCODE_AUTOCOMPLETE_URL = 'https://api.postcodes.io/postcodes';
const POSTCODE_DEBOUNCE_MS = 300;

const TIME_WINDOWS = [
  { value: 'Morning (8am–12pm)', label: 'Morning (8am–12pm)' },
  { value: 'Afternoon (12pm–5pm)', label: 'Afternoon (12pm–5pm)' },
  { value: 'Evening (5pm–8pm)', label: 'Evening (5pm–8pm)' },
  { value: 'Custom', label: 'Custom' },
];

export default function BookNow() {
  const [success, setSuccess] = useState(false);
  const [postcodeSuggestions, setPostcodeSuggestions] = useState([]);
  const [showPostcodeDropdown, setShowPostcodeDropdown] = useState(false);
  const [customTime, setCustomTime] = useState('');
  const postcodeDropdownRef = useRef(null);

  const { values, errors, submitting, submitError, handleChange, handleSubmit, reset } = useForm({
    initialValues: {
      serviceSlug: '',
      propertyAddress: '',
      preferredDate: '',
      timeWindow: '',
      phone: '',
      notes: '',
    },
    validate: (vals) => {
      const errs = {};
      if (!vals.serviceSlug) errs.serviceSlug = 'Please select a service';
      if (!vals.propertyAddress.trim()) errs.propertyAddress = 'Property address is required';
      if (!vals.preferredDate) errs.preferredDate = 'Preferred date is required';
      if (!vals.timeWindow) errs.timeWindow = 'Please select a time window';
      if (vals.timeWindow === 'Custom' && !customTime) errs.timeWindow = 'Please enter a custom time';
      if (!vals.phone.trim()) errs.phone = 'Phone number is required';
      return errs;
    },
    onSubmit: async (vals) => {
      const payload = { ...vals };
      if (vals.timeWindow === 'Custom') payload.timeWindow = customTime;
      await api.post('/api/bookings', payload);
      setSuccess(true);
      setCustomTime('');
      reset();
    },
  });

  const selectedService = SERVICES.find((s) => s.slug === values.serviceSlug);

  const fetchPostcodeSuggestions = useCallback(async (rawInput) => {
    const query = rawInput.replace(/\s+/g, '').toUpperCase();
    if (query.length < 2) {
      setPostcodeSuggestions([]);
      setShowPostcodeDropdown(false);
      return;
    }
    try {
      const res = await fetch(`${POSTCODE_AUTOCOMPLETE_URL}/${encodeURIComponent(query)}/autocomplete?limit=10`);
      const data = await res.json();
      if (data.result && Array.isArray(data.result)) {
        setPostcodeSuggestions(data.result);
        const trimmed = rawInput.trim();
        const exactMatch = data.result.some((pc) => pc === trimmed);
        setShowPostcodeDropdown(data.result.length > 0 && !exactMatch);
      } else {
        setPostcodeSuggestions([]);
        setShowPostcodeDropdown(false);
      }
    } catch {
      setPostcodeSuggestions([]);
      setShowPostcodeDropdown(false);
    }
  }, []);

  useEffect(() => {
    if (!values.propertyAddress.trim()) {
      setPostcodeSuggestions([]);
      setShowPostcodeDropdown(false);
      return;
    }
    const t = setTimeout(() => {
      fetchPostcodeSuggestions(values.propertyAddress);
    }, POSTCODE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [values.propertyAddress, fetchPostcodeSuggestions]);

  const handleAddressChange = (e) => {
    handleChange(e);
    if (!e.target.value.trim()) setShowPostcodeDropdown(false);
  };

  const selectPostcode = (postcode) => {
    handleChange({ target: { name: 'propertyAddress', value: postcode } });
    setShowPostcodeDropdown(false);
    setPostcodeSuggestions([]);
  };

  const handleAddressBlur = () => {
    setTimeout(() => setShowPostcodeDropdown(false), 150);
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-full mb-6">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
            <path d="M6 16l7 7L26 9" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white">Booking Request Submitted</h1>
        <p className="mt-4 text-cream/70">
          Your request is now pending review. We&rsquo;ll get back to you shortly to confirm your booking. Once approved, you&rsquo;ll receive an email with a link to complete payment.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-8 inline-block bg-red text-white text-sm font-medium px-8 py-3 rounded-xl hover:bg-red-dark transition-colors"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-24">
      <h1 className="text-4xl md:text-5xl font-bold text-white">Book Now</h1>
      <p className="mt-4 text-cream/70 max-w-2xl">
        Select a service and fill in the details below. Your request will be reviewed and you&rsquo;ll receive an email to complete payment once approved.
      </p>

      <form onSubmit={handleSubmit} className="mt-12 space-y-6 max-w-xl">
        <div>
          <label htmlFor="serviceSlug" className="block text-sm font-medium mb-2">
            Service
          </label>
          <select
            id="serviceSlug"
            name="serviceSlug"
            value={values.serviceSlug}
            onChange={handleChange}
            className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors text-cream appearance-none cursor-pointer [&>option]:bg-bg [&>option]:text-cream"
          >
            <option value="">Select a service...</option>
            {SERVICES.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name} — £{s.displayPrice}
              </option>
            ))}
          </select>
          {selectedService && (
            <p className="mt-2 text-sm text-red">
              £{selectedService.displayPrice}
            </p>
          )}
          {errors.serviceSlug && <p className="mt-1 text-xs text-red">{errors.serviceSlug}</p>}
        </div>

        <div ref={postcodeDropdownRef} className="relative">
          <label htmlFor="propertyAddress" className="block text-sm font-medium mb-2">
            Property Address
          </label>
          <input
            id="propertyAddress"
            name="propertyAddress"
            type="text"
            value={values.propertyAddress}
            onChange={handleAddressChange}
            onBlur={handleAddressBlur}
            autoComplete="off"
            placeholder="Start typing a UK postcode..."
            className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors text-cream placeholder:text-cream/40"
          />
          {showPostcodeDropdown && postcodeSuggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-full mt-1 py-1 bg-bg-elevated border border-white/10 rounded-xl shadow-lg z-50 max-h-48 overflow-auto">
              {postcodeSuggestions.map((pc) => (
                <li key={pc}>
                  <button
                    type="button"
                    onClick={() => selectPostcode(pc)}
                    className="w-full text-left px-4 py-2 text-sm text-cream/90 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {pc}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {errors.propertyAddress && <p className="mt-1 text-xs text-red">{errors.propertyAddress}</p>}
        </div>

        <div>
          <label htmlFor="preferredDate" className="block text-sm font-medium mb-2">
            Preferred Date
          </label>
          <input
            id="preferredDate"
            name="preferredDate"
            type="date"
            value={values.preferredDate}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors text-cream"
          />
          {errors.preferredDate && <p className="mt-1 text-xs text-red">{errors.preferredDate}</p>}
        </div>

        <div>
          <label htmlFor="timeWindow" className="block text-sm font-medium mb-2">
            Time Window
          </label>
          <select
            id="timeWindow"
            name="timeWindow"
            value={values.timeWindow}
            onChange={handleChange}
            className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors text-cream appearance-none cursor-pointer [&>option]:bg-bg [&>option]:text-cream"
          >
            <option value="">Select a time window...</option>
            {TIME_WINDOWS.map((tw) => (
              <option key={tw.value} value={tw.value}>
                {tw.label}
              </option>
            ))}
          </select>
          {values.timeWindow === 'Custom' && (
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="mt-3 w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors text-cream"
            />
          )}
          {errors.timeWindow && <p className="mt-1 text-xs text-red">{errors.timeWindow}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-2">
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={values.phone}
            onChange={handleChange}
            className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors text-cream placeholder:text-cream/40"
          />
          {errors.phone && <p className="mt-1 text-xs text-red">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-2">
            Notes <span className="text-cream/40">(optional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="Any specific requirements or details about the property"
            value={values.notes}
            onChange={handleChange}
            className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors resize-none text-cream placeholder:text-cream/40"
          />
        </div>

        {submitError && (
          <p className="text-sm text-red">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-red text-white text-sm font-medium px-8 py-3 rounded-xl hover:bg-red-dark transition-colors disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Booking Request'}
        </button>

        <p className="text-xs text-cream/40">
          Your request will be reviewed. You&rsquo;ll only be asked to pay after we confirm availability.
        </p>
      </form>
    </div>
  );
}
