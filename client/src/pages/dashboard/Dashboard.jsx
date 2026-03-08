import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold text-white">Account</h1>
      <p className="mt-2 text-cream/70">Manage your orders and profile.</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          to="/orders"
          className="block p-6 bg-bg-card border border-white/10 rounded-2xl hover:border-white/20 transition-colors"
        >
          <h2 className="text-lg font-semibold text-white">Your orders</h2>
          <p className="mt-1 text-sm text-cream/60">View and track your bookings</p>
        </Link>
        <Link
          to="/dashboard/profile"
          className="block p-6 bg-bg-card border border-white/10 rounded-2xl hover:border-white/20 transition-colors"
        >
          <h2 className="text-lg font-semibold text-white">Profile</h2>
          <p className="mt-1 text-sm text-cream/60">Update your name and email</p>
        </Link>
      </div>
    </div>
  );
}
