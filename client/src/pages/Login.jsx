import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useForm } from '../hooks/useForm.js';

export default function Login() {
  const { login, resendVerification } = useAuth();
  const navigate = useNavigate();
  const [resendSent, setResendSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [adminVerify, setAdminVerify] = useState(false);

  const { values, errors, submitting, submitError, handleChange, handleSubmit } = useForm({
    initialValues: { email: '', password: '' },
    validate: (vals) => {
      const errs = {};
      if (!vals.email.trim()) errs.email = 'Email is required';
      if (!vals.password) errs.password = 'Password is required';
      return errs;
    },
    onSubmit: async (vals) => {
      const data = await login(vals.email, vals.password);
      if (data?.requiresAdminVerification) {
        setAdminVerify(true);
        return;
      }
      navigate('/orders');
    },
  });

  const needsVerification = submitError && (submitError.includes('verify') || submitError.includes('verification'));
  const handleResend = async () => {
    if (!values.email.trim() || resending) return;
    setResending(true);
    try {
      await resendVerification(values.email);
      setResendSent(true);
    } catch {
      // handled by form
    } finally {
      setResending(false);
    }
  };

  if (adminVerify) {
    return (
      <div className="relative max-w-md mx-auto px-6 py-28 text-center">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-accent/[0.06] rounded-full blur-[100px] pointer-events-none" aria-hidden />
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/15 flex items-center justify-center glow-accent">
          <svg className="w-8 h-8 text-accent-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Check your email</h1>
        <p className="mt-3 text-cream/60 text-sm leading-relaxed">
          We sent a login verification link to your email. Click the link to complete sign-in. The link expires in 15 minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="relative max-w-md mx-auto px-6 py-28">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-accent/[0.04] rounded-full blur-[120px] pointer-events-none" aria-hidden />
      <div className="relative glass rounded-2xl p-8 md:p-10 glow-accent">
        <h1 className="text-3xl font-bold text-white">Log in</h1>
        <p className="mt-2 text-cream/50 text-sm">
          Welcome back. Enter your details below.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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
          {needsVerification && (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || !values.email.trim()}
              className="text-sm text-red-light font-medium hover:text-white transition-colors disabled:opacity-50"
            >
              {resendSent ? 'Verification email sent — check your inbox' : 'Resend verification email'}
            </button>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-red via-red-light to-red text-white text-sm font-semibold py-3.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:scale-[1.01] animate-gradient-x disabled:opacity-50"
          >
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="mt-8 text-sm text-cream/40 text-center">
          Don&rsquo;t have an account?{' '}
          <Link to="/register" className="text-accent-light font-medium hover:text-white transition-colors">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
