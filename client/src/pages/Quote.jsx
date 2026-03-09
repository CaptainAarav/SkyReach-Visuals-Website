import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from '../hooks/useForm.js';
import { useAuth } from '../hooks/useAuth.js';
import { api } from '../api/client.js';
import { QUOTE_SERVICES } from '../data/packages.js';

const POSTCODE_AUTOCOMPLETE_URL = 'https://api.postcodes.io/postcodes';
const POSTCODE_DEBOUNCE_MS = 300;

const TIME_OPTIONS = [
  { value: 'Morning (8am–12pm)', label: 'Morning (8am–12pm)' },
  { value: 'Afternoon (12pm–5pm)', label: 'Afternoon (12pm–5pm)' },
  { value: 'Evening (5pm–8pm)', label: 'Evening (5pm–8pm)' },
  { value: 'Flexible', label: 'Flexible' },
  { value: 'Custom', label: 'Custom' },
];

export default function Quote() {
  const { user } = useAuth();
  const [success, setSuccess] = useState(false);
  const [postcodeSuggestions, setPostcodeSuggestions] = useState([]);
  const [showPostcodeDropdown, setShowPostcodeDropdown] = useState(false);
  const [customTime, setCustomTime] = useState('');
  const [budgetDigits, setBudgetDigits] = useState('');
  const postcodeDropdownRef = useRef(null);

  const { values, errors, submitting, submitError, handleChange, handleSubmit, reset } = useForm({
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      location: '',
      serviceType: '',
      message: '',
      budget: '',
      preferredDate: '',
      preferredTime: '',
    },
    validate: (vals) => {
      const errs = {};
      if (!vals.name.trim()) errs.name = 'Name is required';
      if (!vals.email.trim()) errs.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(vals.email)) errs.email = 'Enter a valid email';
      if (!vals.phone.trim()) errs.phone = 'Phone is required';
      if (!vals.location.trim()) errs.location = 'Location is required';
      if (!vals.serviceType.trim()) errs.serviceType = 'Project type is required';
      if (!vals.message.trim()) errs.message = 'Description is required';
      return errs;
    },
    onSubmit: async (vals) => {
      const timeValue = vals.preferredTime === 'Custom' ? customTime : vals.preferredTime;
      await api.post('/api/contact', {
        ...vals,
        budget: budgetDigits ? `£${budgetDigits}` : null,
        preferredDate: vals.preferredDate || null,
        preferredTime: timeValue || null,
      });
      setSuccess(true);
      setCustomTime('');
      setBudgetDigits('');
      reset();
    },
  });

  const selectedQuoteService = QUOTE_SERVICES.find((s) => s.slug === values.serviceType);

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
    if (!values.location.trim()) {
      setPostcodeSuggestions([]);
      setShowPostcodeDropdown(false);
      return;
    }
    const t = setTimeout(() => {
      fetchPostcodeSuggestions(values.location);
    }, POSTCODE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [values.location, fetchPostcodeSuggestions]);

  const handleLocationChange = (e) => {
    handleChange(e);
    if (!e.target.value.trim()) setShowPostcodeDropdown(false);
  };

  const selectPostcode = (postcode) => {
    handleChange({ target: { name: 'location', value: postcode } });
    setShowPostcodeDropdown(false);
    setPostcodeSuggestions([]);
  };

  const handleLocationBlur = () => {
    setTimeout(() => setShowPostcodeDropdown(false), 150);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-24">
      <h1 className="text-4xl md:text-5xl font-bold text-white">Get a Quote</h1>
      <p className="mt-4 text-cream/70 max-w-2xl">
        Tell us about your project and we&rsquo;ll get back to you with a tailored quote.
      </p>

      <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        <div className="max-w-xl">
        {success ? (
          <div className="bg-bg-card p-8 rounded-2xl border border-white/10">
            <h3 className="text-xl font-semibold text-white">Request sent</h3>
            <p className="mt-2 text-cream/70">
              Thanks for getting in touch. We&rsquo;ll come back to you with a quote shortly.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="mt-4 text-sm font-medium text-accent border-b-2 border-accent pb-1 hover:border-red hover:text-red transition-colors"
            >
              Send another request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">Name</label>
              <input
                id="name" name="name" type="text"
                value={values.name} onChange={handleChange}
                className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors text-cream placeholder:text-cream/40"
              />
              {errors.name && <p className="mt-1 text-xs text-red">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
              <input
                id="email" name="email" type="email"
                value={values.email} onChange={handleChange}
                className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors text-cream placeholder:text-cream/40"
              />
              {errors.email && <p className="mt-1 text-xs text-red">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">Phone</label>
              <input
                id="phone" name="phone" type="tel"
                value={values.phone} onChange={handleChange}
                className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors text-cream placeholder:text-cream/40"
              />
              {errors.phone && <p className="mt-1 text-xs text-red">{errors.phone}</p>}
            </div>

            <div ref={postcodeDropdownRef} className="relative">
              <label htmlFor="location" className="block text-sm font-medium mb-2">Location</label>
              <input
                id="location" name="location" type="text"
                value={values.location}
                onChange={handleLocationChange}
                onBlur={handleLocationBlur}
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
              {errors.location && <p className="mt-1 text-xs text-red">{errors.location}</p>}
            </div>

            <div>
              <label htmlFor="serviceType" className="block text-sm font-medium mb-2">Project Type</label>
              <select
                id="serviceType" name="serviceType"
                value={values.serviceType} onChange={handleChange}
                className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors text-cream appearance-none cursor-pointer [&>option]:bg-bg [&>option]:text-cream"
              >
                <option value="">Select a project type...</option>
                {QUOTE_SERVICES.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.name}</option>
                ))}
              </select>
              {selectedQuoteService && (
                <div className="mt-4 p-4 rounded-2xl border border-white/10 bg-bg-card/50">
                  <p className="font-semibold text-white">Get a Quote — {selectedQuoteService.name}</p>
                  <p className="mt-2 text-sm text-cream/80 leading-relaxed">{selectedQuoteService.description}</p>
                </div>
              )}
              {errors.serviceType && <p className="mt-1 text-xs text-red">{errors.serviceType}</p>}
            </div>

            <div>
              <label htmlFor="budget" className="block text-sm font-medium mb-2">Budget <span className="text-cream/40">(optional)</span></label>
              <div className="flex items-center">
                <span className="text-cream/80 mr-1">£</span>
                <input
                  id="budget"
                  type="text"
                  inputMode="numeric"
                  value={budgetDigits}
                  onChange={(e) => setBudgetDigits(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 500"
                  className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors text-cream placeholder:text-cream/40"
                />
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">Description</label>
              <textarea
                id="message" name="message" rows={5}
                value={values.message} onChange={handleChange}
                placeholder="Tell us about your project — what you need, the scope, any special requirements..."
                className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors resize-none text-cream placeholder:text-cream/40"
              />
              {errors.message && <p className="mt-1 text-xs text-red">{errors.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="preferredDate" className="block text-sm font-medium mb-2">
                  Preferred Date <span className="text-cream/40">(optional)</span>
                </label>
                <input
                  id="preferredDate" name="preferredDate" type="date"
                  value={values.preferredDate} onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors text-cream"
                />
              </div>
              <div>
                <label htmlFor="preferredTime" className="block text-sm font-medium mb-2">
                  Preferred Time <span className="text-cream/40">(optional)</span>
                </label>
                <select
                  id="preferredTime" name="preferredTime"
                  value={values.preferredTime} onChange={handleChange}
                  className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors text-cream appearance-none cursor-pointer [&>option]:bg-bg [&>option]:text-cream"
                >
                  <option value="">Select a time...</option>
                  {TIME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {values.preferredTime === 'Custom' && (
                  <div className="mt-3">
                    <label htmlFor="customTime" className="block text-xs text-cream/60 mb-1">Suggested time</label>
                    <input
                      id="customTime"
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors text-cream"
                    />
                  </div>
                )}
              </div>
            </div>

            {submitError && (
              <p className="text-sm text-red">{submitError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="bg-red text-white text-sm font-medium px-8 py-3 rounded-xl hover:bg-red-dark transition-colors disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Submit request'}
            </button>
          </form>
        )}
        </div>

        {!success && (
          <div className="hidden lg:flex flex-col items-center justify-center sticky top-24">
            <img
              src="/logo_with_text Background Removed.png"
              alt="SkyReach Visuals"
              className="w-full max-w-md object-contain"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );
}
