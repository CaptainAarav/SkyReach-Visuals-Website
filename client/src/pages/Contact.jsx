import { useState } from 'react';
import { useForm } from '../hooks/useForm.js';
import { api } from '../api/client.js';

export default function Contact() {
  const [success, setSuccess] = useState(false);

  const { values, errors, submitting, submitError, handleChange, handleSubmit, reset } = useForm({
    initialValues: { name: '', email: '', phone: '', message: '' },
    validate: (vals) => {
      const errs = {};
      if (!vals.name.trim()) errs.name = 'Name is required';
      if (!vals.email.trim()) errs.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(vals.email)) errs.email = 'Enter a valid email';
      if (!vals.message.trim()) errs.message = 'Message is required';
      return errs;
    },
    onSubmit: async (vals) => {
      await api.post('/api/contact', vals);
      setSuccess(true);
      reset();
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-24">
      <h1 className="text-4xl md:text-5xl font-bold text-white">Get in touch</h1>
      <p className="mt-4 text-cream/70 max-w-2xl">
        Got a project in mind? Drop us a message and we&rsquo;ll get back to you
        within 24 hours.
      </p>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-16">
        {/* Form */}
        <div>
          {success ? (
            <div className="bg-bg-card p-8 rounded-2xl border border-white/10">
              <h3 className="text-xl font-semibold text-white">Message sent</h3>
              <p className="mt-2 text-cream/70">
                Thanks for getting in touch. We&rsquo;ll come back to you shortly.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-4 text-sm font-medium text-accent border-b-2 border-accent pb-1 hover:border-red hover:text-red transition-colors"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={values.name}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors text-cream placeholder:text-cream/40 "
                />
                {errors.name && <p className="mt-1 text-xs text-red">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors text-cream placeholder:text-cream/40 "
                />
                {errors.email && <p className="mt-1 text-xs text-red">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">
                  Phone <span className="text-cream/50">(optional)</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={values.phone}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors text-cream placeholder:text-cream/40 "
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={values.message}
                  onChange={handleChange}
                  className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors resize-none text-cream placeholder:text-cream/40 "
                />
                {errors.message && <p className="mt-1 text-xs text-red">{errors.message}</p>}
              </div>

              {submitError && (
                <p className="text-sm text-red">{submitError}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="bg-red text-white text-sm font-medium px-8 py-3 rounded-xl hover:bg-red-dark transition-colors disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Send message'}
              </button>
            </form>
          )}
        </div>

        {/* Contact details */}
        <div className="space-y-8">
          <div>
            <h3 className="text-xs font-semibold tracking-widest uppercase text-cream/50 mb-3">Email</h3>
            <p className="text-cream">support@skyreachvisuals.co.uk</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-widest uppercase text-cream/50 mb-3">Phone</h3>
            <p className="text-cream">07877 691861</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-widest uppercase text-cream/50 mb-3">Location</h3>
            <p className="text-cream">Bournemouth, Dorset, UK</p>
            <p className="mt-1 text-sm text-cream/70">
              We cover all of Dorset, Hampshire, and Wiltshire. Further afield by arrangement.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-widest uppercase text-cream/50 mb-3">Hours</h3>
            <p className="text-cream">Monday to Friday, 9am – 5pm</p>
            <p className="mt-1 text-sm text-cream/70">
              Weekend shoots available by prior arrangement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
