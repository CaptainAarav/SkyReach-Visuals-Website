import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { api } from '../api/client.js';

export default function AdminLoginVerify() {
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid login verification link.');
      return;
    }
    api.get(`/api/auth/admin-login-verify?token=${encodeURIComponent(token)}`)
      .then((data) => {
        setMessage(data?.message || 'Admin login verified.');
        setStatus('success');
        refreshUser().then(() => navigate('/admin/orders', { replace: true }));
      })
      .catch((err) => {
        setMessage(err?.message || 'Login verification link is invalid or expired.');
        setStatus('error');
      });
  }, [searchParams, refreshUser, navigate]);

  if (status === 'loading') {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <p className="text-navy/80">Verifying your login...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <h1 className="text-3xl font-bold text-navy">Login verified</h1>
        <p className="mt-4 text-navy/80">{message}</p>
        <p className="mt-4 text-sm text-navy/60">Taking you to the admin panel...</p>
        <Link to="/admin/orders" className="mt-6 inline-block text-red font-medium hover:underline">
          Go to admin
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold text-navy">Verification failed</h1>
      <p className="mt-4 text-red">{message}</p>
      <p className="mt-4 text-sm text-navy/60">
        Please <Link to="/login" className="text-red font-medium hover:underline">log in</Link> again to request a new verification link.
      </p>
      <Link
        to="/login"
        className="mt-8 inline-block bg-red text-white text-sm font-medium py-3 px-6 hover:bg-red-dark transition-colors"
      >
        Log in
      </Link>
    </div>
  );
}
