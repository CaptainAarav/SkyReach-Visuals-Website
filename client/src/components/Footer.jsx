export default function Footer() {
  return (
    <footer className="bg-black text-white rounded-t-3xl">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <img
              src="/logo_with_text Background Removed.png"
              alt="SkyReach Visuals"
              className="h-16 mb-4"
              loading="lazy"
            />
            <p className="text-white/70 text-sm leading-relaxed max-w-xs">
              Professional aerial videography based in Bournemouth. We capture
              cinematic drone footage for property, events, and creative projects.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase text-white/50 mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {[
                { href: '/#services', label: 'Services' },
                { href: '/#portfolio', label: 'Portfolio' },
                { href: '/#about', label: 'About' },
                { href: '/#contact', label: 'Contact' },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-white/70 hover:text-red transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase text-white/50 mb-4">
              Get in Touch
            </h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li><a href="mailto:support@skyreachvisuals.co.uk" className="hover:text-red transition-colors">support@skyreachvisuals.co.uk</a></li>
              <li><a href="tel:+4407877691861" className="hover:text-red transition-colors">07877 691861</a></li>
              <li>Bournemouth, Dorset, UK</li>
            </ul>
            <div className="flex gap-4 mt-6">
              <a href="https://www.tiktok.com/@skyreachvisuals" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-red transition-colors" aria-label="TikTok">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.43v-7.15a8.16 8.16 0 005.58 2.2v-3.4a4.85 4.85 0 01-4-.59h4z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/skyreachvisuals/" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-red transition-colors" aria-label="Instagram">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-red transition-colors" aria-label="YouTube">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} SkyReach Visuals. All rights reserved. &middot; v1.5
          </p>
          <p className="text-xs text-white/40">
            CAA certified drone operators
          </p>
        </div>
      </div>
    </footer>
  );
}
