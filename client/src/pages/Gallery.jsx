import { useState } from 'react';

const GALLERY_VIDEO = '/videos/paul-srv.mp4';
const GALLERY_POSTER = '/gallery-poster.jpg';

const categories = ['All', 'Property', 'Events', 'Construction', 'Creative'];

const items = [
  { id: 1, label: 'Sandbanks Development', category: 'Property' },
  { id: 2, label: 'Bournemouth Air Festival', category: 'Events' },
  { id: 3, label: 'Harbour Heights Build', category: 'Construction' },
  { id: 4, label: 'Old Harry Rocks', category: 'Creative' },
  { id: 5, label: 'Canford Cliffs Villa', category: 'Property' },
  { id: 6, label: 'Christchurch Regatta', category: 'Events' },
  { id: 7, label: 'Westbourne Office Block', category: 'Construction' },
  { id: 8, label: 'Jurassic Coast Dawn', category: 'Creative' },
  { id: 9, label: 'Poole Quay Apartment', category: 'Property' },
  { id: 10, label: 'Summer Music Festival', category: 'Events' },
  { id: 11, label: 'BCP Infrastructure', category: 'Construction' },
  { id: 12, label: 'Durdle Door Sunset', category: 'Creative' },
];

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? items
    : items.filter((item) => item.category === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-6 py-24">
      {/* Hero video strip — single video on page */}
      <div className="aspect-video max-h-[320px] w-full rounded-2xl overflow-hidden bg-black/40 mb-16">
        <video
          src={GALLERY_VIDEO}
          poster={GALLERY_POSTER}
          className="w-full h-full object-cover"
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          aria-hidden
        />
      </div>

      <h1 className="text-4xl md:text-5xl font-bold text-white">Our Work</h1>
      <p className="mt-4 text-cream/70 max-w-2xl">
        A selection of aerial projects from across Bournemouth, Poole, and the
        Dorset coast. Each project is shot and edited in-house.
      </p>

      {/* Category filters */}
      <div className="mt-10 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-sm px-4 py-2 transition-colors rounded-xl ${
              activeCategory === cat
                ? 'bg-accent text-white'
                : 'bg-bg-card text-cream/80 hover:text-white border border-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid with poster image (one video request per page instead of 13) */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="group relative aspect-video bg-black/40 overflow-hidden rounded-2xl bg-cover bg-center"
            style={{ backgroundImage: `url(${GALLERY_POSTER})` }}
          >
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-end p-5">
              <div className="translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
                  {item.category}
                </span>
                <h3 className="text-white font-medium mt-1">{item.label}</h3>
              </div>
            </div>
            <span className="absolute bottom-4 left-5 text-xs text-white/60 uppercase tracking-wider group-hover:opacity-0 transition-opacity">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
