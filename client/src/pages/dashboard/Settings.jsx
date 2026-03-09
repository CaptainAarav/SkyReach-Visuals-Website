import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme.js';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="max-w-2xl mx-auto px-6 py-24">
      <Link to="/dashboard" className="text-sm text-cream/60 hover:text-cream transition-colors">
        &larr; Back to account
      </Link>

      <h1 className="mt-8 text-3xl font-bold text-white">Settings</h1>
      <p className="mt-2 text-cream/70">Profile, preferences and appearance.</p>

      <div className="mt-10 space-y-6">
        <section className="bg-bg-card border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">Profile</h2>
          <p className="text-sm text-cream/60 mb-4">Update your name, email and password.</p>
          <Link
            to="/dashboard/profile"
            className="inline-block text-sm font-medium text-red hover:text-red-dark transition-colors"
          >
            Open Profile &rarr;
          </Link>
        </section>

        <section className="bg-bg-card border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">Appearance</h2>
          <p className="text-sm text-cream/60 mb-4">Switch between light and dark mode.</p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-cream/50">Currently: {isDark ? 'Dark' : 'Light'}</span>
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg border border-white/20 text-cream hover:bg-white/5 transition-colors"
              aria-pressed={!isDark}
            >
              <span className="text-lg">{isDark ? '☀️' : '🌙'}</span>
              <span>Switch to {isDark ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
