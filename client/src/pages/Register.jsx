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
    <div className="max-w-md mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold">Check your email</h1>
      <p className="mt-4 text-navy/80">
        We&rsquo;ve sent a verification link to <strong>{email}</strong>. Click the button in that email to verify your account, then you can log in.
      </p>
      <p className="mt-6 text-sm text-navy/60">
        Didn&rsquo;t get the email? Check your spam folder.
      </p>
      <div className="mt-6 flex flex-col gap-3 items-start">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-sm font-medium text-red hover:underline disabled:opacity-50"
        >
          {resendSent ? 'Verification email sent — check your inbox' : 'Resend verification email'}
        </button>
        {resendError && <p className="text-sm text-red">{resendError}</p>}
        <Link
          to="/login"
          className="inline-block bg-red text-white text-sm font-medium py-3 px-6 rounded-xl hover:bg-red-dark transition-colors"
        >
          Go to log in
        </Link>
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
    <div className="max-w-md mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold">Create an account</h1>
      <p className="mt-2 text-navy/60 text-sm">
        Register to book a shoot and manage your projects.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6" noValidate>
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={values.name}
            onChange={handleChange}
            className="w-full bg-transparent border-b-2 border-navy/20 focus:border-navy outline-none py-2 transition-colors"
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

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-red text-white text-sm font-medium py-3 hover:bg-red-dark transition-colors disabled:opacity-50"
        >
          {submitting ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <p className="mt-8 text-sm text-navy/60 text-center">
        Already have an account?{' '}
        <Link to="/login" className="text-navy font-medium hover:text-red transition-colors">
          Log in
        </Link>
      </p>
    </div>
  );
}
