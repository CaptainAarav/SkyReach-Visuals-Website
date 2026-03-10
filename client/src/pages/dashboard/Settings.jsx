import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme.js';
import { api } from '../../api/client.js';
import { startRegistration } from '@simplewebauthn/browser';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const [passkeyAdding, setPasskeyAdding] = useState(false);
  const [passkeyMessage, setPasskeyMessage] = useState(null);

  const handleAddPasskey = async () => {
    setPasskeyMessage(null);
    setPasskeyAdding(true);
    try {
      const options = await api.post('/api/auth/passkey/register/options');
      const response = await startRegistration({ optionsJSON: options });
      await api.post('/api/auth/passkey/register', response);
      setPasskeyMessage('Passkey added. You can now sign in with “Use passkey” on the login page.');
    } catch (err) {
      setPasskeyMessage(err.message || 'Could not add passkey');
    } finally {
      setPasskeyAdding(false);
    }
  };

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
          <h2 className="text-lg font-semibold text-white mb-1">Passkey</h2>
          <p className="text-sm text-cream/60 mb-4">Sign in without a password using your device or security key.</p>
          {passkeyMessage && (
            <p className={`text-sm mb-4 ${passkeyMessage.startsWith('Passkey added') ? 'text-green-400' : 'text-red'}`}>
              {passkeyMessage}
            </p>
          )}
          <button
            type="button"
            onClick={handleAddPasskey}
            disabled={passkeyAdding}
            className="px-4 py-2 rounded-xl bg-bg border border-white/20 text-cream hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {passkeyAdding ? 'Adding passkey...' : 'Add passkey'}
          </button>
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
