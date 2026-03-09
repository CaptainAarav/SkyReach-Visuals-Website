import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { api } from '../api/client.js';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }
    api.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((data) => {
        setMessage(data?.message || 'Email verified.');
        setStatus('success');
        refreshUser().then(() => navigate('/orders', { replace: true }));
      })
      .catch((err) => {
        setMessage(err?.message || 'Verification link is invalid or expired.');
        setStatus('error');
      });
  }, [searchParams, refreshUser, navigate]);

  if (status === 'loading') {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <p className="text-navy/80">Verifying your email...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <h1 className="text-3xl font-bold text-navy">Email verified</h1>
        <p className="mt-4 text-navy/80">{message}</p>
        <p className="mt-4 text-sm text-navy/60">Taking you to your orders...</p>
        <Link to="/orders" className="mt-6 inline-block text-red font-medium hover:underline">
          Go to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold text-navy">Verification failed</h1>
      <p className="mt-4 text-red">{message}</p>
      <p className="mt-4 text-sm text-navy/60">
        You can request a new verification email from the <Link to="/login" className="text-red font-medium hover:underline">log in</Link> page.
      </p>
      <Link
        to="/login"
        className="mt-8 inline-block bg-red text-white text-sm font-medium py-3 px-6 rounded-xl hover:bg-red-dark transition-colors"
      >
        Log in
      </Link>
    </div>
  );
}
