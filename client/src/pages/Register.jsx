import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useForm } from '../hooks/useForm.js';

function RegisterSuccessScreen({ email, resendVerification }) {
  const [resendSent, setResendSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState(null);

  const handleResend = async () => {
    setResendError(null);
    setResending(true);
    try {
      await resendVerification(email);
      setResendSent(true);
    } catch (err) {
      setResendError(err?.message || 'Failed to resend. Try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative max-w-md mx-auto px-6 py-28">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/[0.04] rounded-full blur-[100px] pointer-events-none" aria-hidden />
      <div className="relative glass rounded-2xl p-8 md:p-10">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5">
          <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        </div>
        <h1 className="text-3xl font-bold text-white">Check your email</h1>
        <p className="mt-4 text-cream/70">
          We&rsquo;ve sent a verification link to <strong className="text-white">{email}</strong>. Click the button in that email to verify your account, then you can log in.
        </p>
        <p className="mt-4 text-sm text-cream/50">
          Didn&rsquo;t get the email? Check your spam folder.
        </p>
        <div className="mt-6 flex flex-col gap-3 items-start">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-sm font-medium text-accent-light hover:text-white transition-colors disabled:opacity-50"
          >
            {resendSent ? 'Verification email sent — check your inbox' : 'Resend verification email'}
          </button>
          {resendError && <p className="text-sm text-red">{resendError}</p>}
          <Link
            to="/login"
            className="inline-block bg-gradient-to-r from-red via-red-light to-red text-white text-sm font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] animate-gradient-x"
          >
            Go to log in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  const { register, resendVerification } = useAuth();
  const [successEmail, setSuccessEmail] = useState(null);

  const { values, errors, submitting, submitError, handleChange, handleSubmit } = useForm({
    initialValues: { name: '', email: '', password: '' },
    validate: (vals) => {
      const errs = {};
      if (!vals.name.trim()) errs.name = 'Name is required';
      if (!vals.email.trim()) errs.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(vals.email)) errs.email = 'Enter a valid email';
      if (!vals.password) errs.password = 'Password is required';
      else if (vals.password.length < 8) errs.password = 'Must be at least 8 characters';
      return errs;
    },
    onSubmit: async (vals) => {
      const data = await register(vals.name, vals.email, vals.password);
      setSuccessEmail(data?.email ?? vals.email);
    },
  });

  if (successEmail) {
    return (
      <RegisterSuccessScreen
        email={successEmail}
        resendVerification={resendVerification}
      />
    );
  }

  return (
    <div className="relative max-w-md mx-auto px-6 py-28">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-accent/[0.04] rounded-full blur-[120px] pointer-events-none" aria-hidden />
      <div className="relative glass rounded-2xl p-8 md:p-10 glow-accent">
        <h1 className="text-3xl font-bold text-white">Create an account</h1>
        <p className="mt-2 text-cream/50 text-sm">
          Register to book a shoot and manage your projects.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2 text-cream/70">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={values.name}
              onChange={handleChange}
              className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-accent/50 focus:bg-white/[0.05] outline-none py-3 px-4 transition-all duration-300 text-cream rounded-xl focus:shadow-[0_0_20px_rgba(124,58,237,0.1)]"
            />
            {errors.name && <p className="mt-1 text-xs text-red">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-cream/70">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-accent/50 focus:bg-white/[0.05] outline-none py-3 px-4 transition-all duration-300 text-cream rounded-xl focus:shadow-[0_0_20px_rgba(124,58,237,0.1)]"
            />
            {errors.email && <p className="mt-1 text-xs text-red">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2 text-cream/70">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={values.password}
              onChange={handleChange}
              className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-accent/50 focus:bg-white/[0.05] outline-none py-3 px-4 transition-all duration-300 text-cream rounded-xl focus:shadow-[0_0_20px_rgba(124,58,237,0.1)]"
            />
            {errors.password && <p className="mt-1 text-xs text-red">{errors.password}</p>}
          </div>

          {submitError && (
            <p className="text-sm text-red">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-accent via-accent-light to-accent text-white text-sm font-semibold py-3.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:scale-[1.01] animate-gradient-x disabled:opacity-50"
          >
            {submitting ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-8 text-sm text-cream/40 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-light font-medium hover:text-white transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
