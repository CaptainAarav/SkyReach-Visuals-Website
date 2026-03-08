import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useForm } from '../hooks/useForm.js';

export default function Login() {
  const { login, resendVerification } = useAuth();
  const navigate = useNavigate();
  const [resendSent, setResendSent] = useState(false);
  const [resending, setResending] = useState(false);

  const { values, errors, submitting, submitError, handleChange, handleSubmit } = useForm({
    initialValues: { email: '', password: '' },
    validate: (vals) => {
      const errs = {};
      if (!vals.email.trim()) errs.email = 'Email is required';
      if (!vals.password) errs.password = 'Password is required';
      return errs;
    },
    onSubmit: async (vals) => {
      await login(vals.email, vals.password);
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
    } catch (e) {
      // submitError will show from form if needed
    } finally {
      setResending(false);
    }
  };

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

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-red text-white text-sm font-medium py-3 hover:bg-red-dark transition-colors disabled:opacity-50"
        >
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
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
