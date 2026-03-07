import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PACKAGES } from '../data/packages.js';
import PackageCard from '../components/PackageCard.jsx';

const galleryPlaceholders = [
  'Property Aerial', 'Event Coverage', 'Construction Progress',
  'Coastal Landscape', 'Commercial Shoot', 'Wedding Film',
];

const HERO_VIDEO_SRC = '/videos/paul-srv.mp4';

export default function Home() {
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {});
  }, []);

  return (
    <>
      {/* Hero with background video */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={HERO_VIDEO_SRC}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          loop
          playsInline
          aria-hidden
        />
        <div className="absolute inset-0 bg-black/50" aria-hidden />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
          <img
            src="/skyreach-visuals-logo-borderless.png"
            alt="SkyReach Visuals"
            className="mx-auto h-24 sm:h-32 md:h-40 lg:h-48 w-auto object-contain"
          />
          <h1 className="mt-8 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-white">
            SkyReach Visuals – Drone Photography in Bournemouth
          </h1>
          <p className="mt-6 text-lg md:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed">
            Affordable aerial photos and videos for property, roof inspections and businesses.
          </p>
          <Link
            to="/services"
            className="mt-10 inline-block bg-red text-white text-sm font-medium px-8 py-4 hover:bg-red-dark transition-colors"
          >
            View packages
          </Link>
        </div>
      </section>

      {/* Services overview */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-3xl md:text-4xl font-semibold text-black">Three packages, one standard.</h2>
        <p className="mt-3 text-black-muted/70 max-w-xl">
          Whether you need a quick aerial clip or a full cinematic production, we
          have a package that fits. Every shoot is delivered to the same professional
          standard.
        </p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {PACKAGES.map((pkg) => (
            <PackageCard key={pkg.slug} {...pkg} compact />
          ))}
        </div>
      </section>

      {/* About snippet with video */}
      <section className="bg-cream-dark">
        <div className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="aspect-video bg-black/10 overflow-hidden rounded-lg">
            <video src={HERO_VIDEO_SRC} className="w-full h-full object-cover" muted loop playsInline aria-hidden />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold leading-tight text-black">
              We fly. We film.<br />We deliver.
            </h2>
            <p className="mt-6 text-black-muted/80 leading-relaxed">
              SkyReach Visuals is a Bournemouth-based drone videography company
              built on a simple idea: aerial footage should look as good as anything
              shot on the ground. We work with property agents, event organisers,
              construction firms, and creative teams to produce footage that actually
              gets used — not filed away.
            </p>
            <Link
              to="/about"
              className="mt-6 inline-block text-sm font-medium text-accent border-b-2 border-accent pb-1 hover:border-red hover:text-red transition-colors"
            >
              More about us
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery teaser */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-3xl md:text-4xl font-semibold text-black">Recent work</h2>
        <p className="mt-3 text-black-muted/70">
          A selection of projects from across the south coast.
        </p>
        <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4">
          {galleryPlaceholders.map((label) => (
            <div
              key={label}
              className="relative aspect-video bg-accent/10 flex items-end p-4 rounded overflow-hidden"
            >
              <video src={HERO_VIDEO_SRC} className="absolute inset-0 w-full h-full object-cover opacity-40" muted loop playsInline aria-hidden />
              <span className="relative text-xs font-medium text-black/70 uppercase tracking-wider">
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link
            to="/gallery"
            className="text-sm font-medium text-accent border-b-2 border-accent pb-1 hover:border-red hover:text-red transition-colors"
          >
            View full portfolio
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cream-dark">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-black">Ready to book your shoot?</h2>
          <p className="mt-3 text-black-muted/70">
            Pick a package, choose your date, and we&rsquo;ll handle the rest.
          </p>
          <Link
            to="/services"
            className="mt-8 inline-block bg-red text-white text-sm font-medium px-8 py-4 hover:bg-red-dark transition-colors"
          >
            See packages
          </Link>
        </div>
      </section>
    </>
  );
}
