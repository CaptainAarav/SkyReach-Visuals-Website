import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useTheme } from '../hooks/useTheme.js';
import { useAuth } from '../hooks/useAuth.js';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

const TRACKED_SESSION_KEY = 'skyreach_view_sent';

function TrackPageView() {
  const { pathname } = useLocation();
  const { user, loading } = useAuth();
  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    if (loading) return;
    if (user && (user.role === 'ADMIN' || user.role === 'CUSTOMER_SUPPORT')) return;
    if (sessionStorage.getItem(TRACKED_SESSION_KEY)) return;
    sessionStorage.setItem(TRACKED_SESSION_KEY, '1');
    fetch('/api/analytics/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {});
  }, [pathname, user, loading]);
  return null;
}

export default function MainLayout() {
  useTheme();
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <TrackPageView />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
