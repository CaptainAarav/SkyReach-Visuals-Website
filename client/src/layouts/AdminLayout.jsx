import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/accounts', label: 'Accounts' },
  { to: '/admin/messages', label: 'Messages' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/logs', label: 'Logs' },
];

export default function AdminLayout() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Admin</h1>
      <nav className="flex flex-wrap gap-2 mb-10">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `text-sm font-medium px-4 py-2 rounded-xl transition-colors ${
                isActive
                  ? 'bg-accent text-white'
                  : 'bg-bg-card text-cream/80 hover:text-white border border-white/10'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
