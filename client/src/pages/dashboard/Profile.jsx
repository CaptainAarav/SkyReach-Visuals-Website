import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { api } from '../../api/client.js';

export default function Profile() {
  const { user, login } = useAuth();

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileSaving(true);

    try {
      await api.put('/api/auth/profile', { name, email });
      setProfileSuccess(true);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordSaving(true);
    try {
      await api.put('/api/auth/password', { currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-24">
      <Link to="/dashboard" className="text-sm text-navy/60 hover:text-navy transition-colors">
        &larr; Back to bookings
      </Link>

      <h1 className="mt-8 text-3xl font-bold">Profile</h1>

      {/* Update profile */}
      <form onSubmit={handleProfileSubmit} className="mt-10 space-y-6">
        <h2 className="text-lg font-semibold">Your details</h2>

        <div>
          <label htmlFor="profileName" className="block text-sm font-medium mb-2">Name</label>
          <input
            id="profileName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent border-b-2 border-navy/20 focus:border-navy outline-none py-2 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="profileEmail" className="block text-sm font-medium mb-2">Email</label>
          <input
            id="profileEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border-b-2 border-navy/20 focus:border-navy outline-none py-2 transition-colors"
          />
        </div>

        {profileError && <p className="text-sm text-red">{profileError}</p>}
        {profileSuccess && <p className="text-sm text-emerald-700">Profile updated.</p>}

        <button
          type="submit"
          disabled={profileSaving}
          className="bg-navy text-cream text-sm font-medium px-6 py-3 hover:bg-navy-light transition-colors disabled:opacity-50"
        >
          {profileSaving ? 'Saving...' : 'Update profile'}
        </button>
      </form>

      <hr className="my-12 border-navy/10" />

      {/* Change password */}
      <form onSubmit={handlePasswordSubmit} className="space-y-6">
        <h2 className="text-lg font-semibold">Change password</h2>

        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">
            Current password
          </label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full bg-transparent border-b-2 border-navy/20 focus:border-navy outline-none py-2 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-transparent border-b-2 border-navy/20 focus:border-navy outline-none py-2 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-transparent border-b-2 border-navy/20 focus:border-navy outline-none py-2 transition-colors"
          />
        </div>

        {passwordError && <p className="text-sm text-red">{passwordError}</p>}
        {passwordSuccess && <p className="text-sm text-emerald-700">Password changed.</p>}

        <button
          type="submit"
          disabled={passwordSaving}
          className="bg-navy text-cream text-sm font-medium px-6 py-3 hover:bg-navy-light transition-colors disabled:opacity-50"
        >
          {passwordSaving ? 'Saving...' : 'Change password'}
        </button>
      </form>
    </div>
  );
}
