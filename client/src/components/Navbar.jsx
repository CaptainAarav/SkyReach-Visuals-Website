import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const sectionLinks = [
  { hash: '#services', label: 'Services' },
  { hash: '#portfolio', label: 'Portfolio' },
  { hash: '#about', label: 'About' },
  { hash: '#contact', label: 'Contact' },
];

function scrollToSection(hash) {
  const id = hash.slice(1);
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const isHome = location.pathname === '/';
  const isStaff = user?.role === 'ADMIN' || user?.role === 'CUSTOMER_SUPPORT';

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10 rounded-b-2xl supports-[backdrop-filter]:bg-black/20">
      <div className="w-full pl-4 pr-4 md:pr-6 min-h-[4rem] py-2 flex items-center justify-between md:justify-start md:gap-2">
        <Link
          to="/"
          className="flex items-center shrink-0 rounded-lg overflow-hidden"
          aria-label="Go to home"
          onClick={(e) => {
            if (isHome) {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          <img
            src="/logo_without_text.PNG"
            alt="SkyReach Visuals"
            className="h-10 sm:h-11 md:h-12 lg:h-14 w-auto object-contain"
          />
        </Link>

        {/* Center: SkyReach Visuals — flex-1 so it stays between logo and nav, truncates if needed */}
        <div className="flex-1 flex justify-center min-w-0 overflow-hidden hidden md:flex">
          <Link
            to="/"
            className="text-xl lg:text-2xl xl:text-3xl font-bold text-white hover:text-cream/90 transition-colors truncate max-w-full px-2"
            style={{ fontFamily: 'var(--font-title)', letterSpacing: '0.12em' }}
            onClick={(e) => {
              if (isHome) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            SkyReach Visuals
          </Link>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4 lg:gap-8 shrink-0">
          {sectionLinks.map((link) => (
            <button
              key={link.hash}
              type="button"
              onClick={() => {
                if (isHome) {
                  scrollToSection(link.hash);
                } else {
                  navigate('/' + link.hash);
                }
              }}
              className="text-sm tracking-wide transition-colors text-cream/80 hover:text-white"
            >
              {link.label}
            </button>
          ))}

          <Link
            to="/get-started"
            className="text-sm bg-red px-4 py-2 rounded-xl text-white hover:bg-red-dark transition-colors"
          >
            Get Started
          </Link>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                className="text-sm tracking-wide transition-colors text-cream/80 hover:text-white flex items-center gap-1"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                {user.name}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={dropdownOpen ? 'rotate-180' : ''}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 py-2 w-48 bg-bg-elevated border border-white/10 rounded-xl shadow-lg z-50">
                  <Link
                    to="/orders"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-cream/80 hover:text-white hover:bg-white/5"
                  >
                    Orders
                  </Link>
                  <Link
                    to="/dashboard/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-cream/80 hover:text-white hover:bg-white/5"
                  >
                    Settings
                  </Link>
                  {isStaff && (
                    <Link
                      to="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-cream/80 hover:text-white hover:bg-white/5"
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => { setDropdownOpen(false); logout(); }}
                    className="block w-full text-left px-4 py-2 text-sm text-cream/60 hover:text-cream hover:bg-white/5"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="text-sm bg-red px-4 py-2 rounded-xl text-white hover:bg-red-dark transition-colors"
            >
              Log in
            </Link>
          )}
        </div>

        {/* Mobile hamburger — fully solid, no transparency */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-cream p-2.5 rounded-xl bg-bg-card hover:bg-bg-elevated border border-white/10 transition-colors"
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

      {/* Mobile menu — solid panel, no transparency */}
      {menuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div className="md:hidden fixed left-4 right-4 top-[4.5rem] z-50 max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-2xl border border-white/10 bg-bg-card shadow-2xl">
            <nav className="flex flex-col py-4 px-6" aria-label="Mobile menu">
              {sectionLinks.map((link) => (
                <button
                  key={link.hash}
                  type="button"
                  onClick={() => {
                    if (isHome) {
                      scrollToSection(link.hash);
                    } else {
                      navigate('/' + link.hash);
                    }
                    setMenuOpen(false);
                  }}
                  className="py-3.5 text-lg text-cream/90 hover:text-white transition-colors border-b border-white/5 last:border-0 text-left"
                >
                  {link.label}
                </button>
              ))}
              <Link
                to="/get-started"
                onClick={() => setMenuOpen(false)}
                className="mt-2 py-3.5 text-center text-lg font-medium bg-red text-white rounded-xl hover:bg-red-dark transition-colors"
              >
                Get Started
              </Link>
              <div className="mt-4 pt-4 border-t border-white/10">
                {user ? (
                  <>
                    <p className="px-0 py-2 text-sm text-cream/50">{user.name}</p>
                    <Link
                      to="/orders"
                      onClick={() => setMenuOpen(false)}
                      className="block py-3.5 text-lg text-cream/90 hover:text-white transition-colors"
                    >
                      Orders
                    </Link>
                    <Link
                      to="/dashboard/settings"
                      onClick={() => setMenuOpen(false)}
                      className="block py-3.5 text-lg text-cream/90 hover:text-white transition-colors"
                    >
                      Settings
                    </Link>
                    {isStaff && (
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="block py-3.5 text-lg text-cream/90 hover:text-white transition-colors"
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="w-full text-left py-3.5 text-lg text-cream/60 hover:text-cream transition-colors"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block py-3.5 text-center text-lg font-medium bg-red text-white rounded-xl hover:bg-red-dark transition-colors"
                  >
                    Log in
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </nav>
  );
}
