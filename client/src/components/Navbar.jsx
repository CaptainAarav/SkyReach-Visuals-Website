import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const navLinks = [
  { to: '/services', label: 'Services' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-cream-dark">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/skyreach-visuals-logo-borderless.png"
            alt="SkyReach Visuals"
            className="h-10"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm tracking-wide transition-colors ${
                  isActive ? 'text-accent font-medium' : 'text-black-muted hover:text-black'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}

          {user ? (
            <div className="flex items-center gap-4">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `text-sm tracking-wide transition-colors ${
                    isActive ? 'text-accent font-medium' : 'text-black-muted hover:text-black'
                  }`
                }
              >
                Dashboard
              </NavLink>
              <button
                onClick={logout}
                className="text-sm text-black-muted/60 hover:text-black transition-colors"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-sm bg-red px-4 py-2 text-white hover:bg-red-dark transition-colors"
            >
              Log in
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-black p-2"
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-white z-40 flex flex-col items-center justify-center gap-8">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="text-2xl text-black-muted hover:text-black transition-colors"
            >
              {link.label}
            </NavLink>
          ))}
          {user ? (
            <>
              <NavLink
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="text-2xl text-black-muted hover:text-black transition-colors"
              >
                Dashboard
              </NavLink>
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="text-lg text-black-muted/60 hover:text-black transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="text-2xl bg-red px-6 py-3 text-white"
            >
              Log in
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
