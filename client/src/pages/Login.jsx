import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useForm } from '../hooks/useForm.js';
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';

export default function Login() {
  const { login, loginWithPasskey, resendVerification } = useAuth();
  const navigate = useNavigate();
  const [resendSent, setResendSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [adminVerify, setAdminVerify] = useState(false);
  const [adminVerifyUrl, setAdminVerifyUrl] = useState(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState(null);
  const [passkeySupported, setPasskeySupported] = useState(false);
  useEffect(() => {
    setPasskeySupported(browserSupportsWebAuthn());
  }, []);

  const { values, errors, submitting, submitError, handleChange, handleSubmit } = useForm({
    initialValues: { email: '', password: '', rememberMe: true },
    validate: (vals) => {
      const errs = {};
      if (!vals.email.trim()) errs.email = 'Email is required';
      if (!vals.password) errs.password = 'Password is required';
      return errs;
    },
    onSubmit: async (vals) => {
      const data = await login(vals.email, vals.password, vals.rememberMe);
      if (data?.requiresAdminVerification) {
        setAdminVerify(true);
        setAdminVerifyUrl(data?.adminVerifyUrl || null);
        return;
      }
      navigate('/orders');
    },
  });

  const handlePasskey = async () => {
    const email = values.email?.trim();
    if (!email) {
      setPasskeyError('Enter your email above first.');
      return;
    }
    setPasskeyError(null);
    setPasskeyLoading(true);
    try {
      await loginWithPasskey(email, values.rememberMe);
      navigate('/orders');
    } catch (err) {
      setPasskeyError(err.message || 'Passkey sign-in failed');
    } finally {
      setPasskeyLoading(false);
    }
  };

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
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Check your email</h1>
        <p className="mt-3 text-cream/70 text-sm leading-relaxed">
          We sent a login verification link to your email. Click the link to complete sign-in. The link expires in 15 minutes.
        </p>
        {adminVerifyUrl && (
          <p className="mt-6 text-cream/60 text-sm">
            Email is not configured on this server.{' '}
            <a href={adminVerifyUrl} className="text-red font-medium hover:underline">
              Click here to complete sign-in
            </a>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold">Log in</h1>
      <p className="mt-2 text-navy/60 text-sm">
        Welcome back. Enter your details below.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
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
            className="w-full bg-transparent border-b-2 border-navy/20 focus:border-navy outline-none py-2 transition-colors"
          />
          {errors.email && <p className="mt-1 text-xs text-red">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={values.password}
            onChange={handleChange}
            className="w-full bg-transparent border-b-2 border-navy/20 focus:border-navy outline-none py-2 transition-colors"
          />
          {errors.password && <p className="mt-1 text-xs text-red">{errors.password}</p>}
        </div>

        <div className="flex items-center gap-2">
          <input
            id="rememberMe"
            name="rememberMe"
            type="checkbox"
            checked={values.rememberMe}
            onChange={(e) => handleChange({ target: { name: 'rememberMe', value: e.target.checked } })}
            className="rounded border-navy/30 text-red focus:ring-red"
          />
          <label htmlFor="rememberMe" className="text-sm text-navy/80">
            Remember me
          </label>
        </div>

        {submitError && (
          <p className="text-sm text-red">{submitError}</p>
        )}
        {needsVerification && (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || !values.email.trim()}
            className="text-sm text-red font-medium hover:underline disabled:opacity-50"
          >
            {resendSent ? 'Verification email sent — check your inbox' : 'Resend verification email'}
          </button>
        )}

        {passkeyError && (
          <p className="text-sm text-red">{passkeyError}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-red text-white text-sm font-medium py-3 hover:bg-red-dark transition-colors disabled:opacity-50"
        >
          {submitting ? 'Logging in...' : 'Log in'}
        </button>

        {passkeySupported && (
          <>
            <div className="relative my-4 text-center">
              <span className="bg-[var(--bg)] px-2 text-xs text-navy/50">or</span>
            </div>
            <button
              type="button"
              onClick={handlePasskey}
              disabled={passkeyLoading || submitting}
              className="w-full border-2 border-navy/30 text-navy py-3 text-sm font-medium hover:border-navy hover:bg-navy/5 transition-colors disabled:opacity-50"
            >
              {passkeyLoading ? 'Signing in with passkey...' : 'Use passkey'}
            </button>
          </>
        )}
      </form>

      <p className="mt-8 text-sm text-navy/60 text-center">
        Don&rsquo;t have an account?{' '}
        <Link to="/register" className="text-navy font-medium hover:text-red transition-colors">
          Register
        </Link>
      </p>
    </div>
  );
}
