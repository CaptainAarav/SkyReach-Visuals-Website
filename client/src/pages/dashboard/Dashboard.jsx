import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="relative max-w-4xl mx-auto px-6 py-28">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-accent/[0.04] rounded-full blur-[120px] pointer-events-none" aria-hidden />
      <h1 className="text-3xl font-bold text-white">Account</h1>
      <p className="mt-2 text-cream/50">Manage your orders and profile.</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          to="/orders"
          className="group relative block p-6 bg-bg-card/70 backdrop-blur-sm border border-white/[0.06] rounded-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(124,58,237,0.1)] overflow-hidden"
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <h2 className="text-lg font-semibold text-white group-hover:text-accent-light transition-colors">Your orders</h2>
          <p className="mt-1 text-sm text-cream/50">View and track your bookings</p>
        </Link>
        <Link
          to="/dashboard/profile"
          className="group relative block p-6 bg-bg-card/70 backdrop-blur-sm border border-white/[0.06] rounded-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(220,38,38,0.1)] overflow-hidden"
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-red to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <h2 className="text-lg font-semibold text-white group-hover:text-red-light transition-colors">Profile</h2>
          <p className="mt-1 text-sm text-cream/50">Update your name and email</p>
        </Link>
      </div>
    </div>
  );
}
