import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from '../hooks/useForm.js';
import { api } from '../api/client.js';

const HERO_VIDEO = '/SkyReach Visuals Website Preview background.mp4';

const SERVICES = [
  { title: 'Roof & Chimney Inspections', description: 'Aerial photos to safely inspect roofs, chimneys and gutters without ladders.' },
  { title: 'Property Aerial Photos', description: 'High-quality aerial photos for homes, property listings and estate marketing.' },
  { title: 'Gutter Inspections', description: 'Safe, fast drone inspections of gutters and hard-to-reach areas.' },
];

const GALLERY_VIDEO = '/videos/paul-srv.mp4';
const GALLERY_POSTER = '/gallery-poster.jpg';
const categories = ['All', 'Property', 'Events', 'Construction', 'Creative'];
const galleryItems = [
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

const ABOUT_VIDEO = '/videos/paul-srv.mp4';

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Home() {
  const location = useLocation();
  const [galleryCategory, setGalleryCategory] = useState('All');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [heroVideoReady, setHeroVideoReady] = useState(false);

  const contactForm = useForm({
    initialValues: { name: '', email: '', phone: '', message: '' },
    validate: (vals) => {
      const errs = {};
      if (!vals.name.trim()) errs.name = 'Name is required';
      if (!vals.email.trim()) errs.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(vals.email)) errs.email = 'Enter a valid email';
      if (!vals.message.trim()) errs.message = 'Message is required';
      return errs;
    },
    onSubmit: async (vals) => {
      await api.post('/api/contact', vals);
      setContactSuccess(true);
      contactForm.reset();
    },
  });

  useEffect(() => {
    const hash = location.hash?.slice(1);
    if (hash) {
      const el = document.getElementById(hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [location.pathname, location.hash]);

  const filteredGallery = galleryCategory === 'All'
    ? galleryItems
    : galleryItems.filter((item) => item.category === galleryCategory);

  return (
    <>
      {/* Hero — video fills whole screen from top, no gap above */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black rounded-b-3xl -mt-20">
        <video
          src={HERO_VIDEO}
          poster="/hero-poster.jpg"
          className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-700 transform-gpu ${heroVideoReady ? 'opacity-100' : 'opacity-0'}`}
          muted
          playsInline
          loop
          autoPlay
          preload="auto"
          fetchpriority="high"
          aria-hidden
          onCanPlay={() => setHeroVideoReady(true)}
        />
        <div className="absolute inset-0 bg-black/30 pointer-events-none" aria-hidden />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center flex flex-col items-center justify-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold leading-tight text-white" style={{ letterSpacing: '0.2em' }}>
            SkyReach Visuals
          </h1>
          <p className="subtitle mt-5 text-2xl sm:text-3xl md:text-4xl text-white/90">
            Drone Photography in Bournemouth
          </p>
          <p className="mt-6 text-xl md:text-2xl text-white/85 max-w-2xl mx-auto leading-relaxed">
            Affordable aerial photos and videos for property, roof inspections and businesses.
          </p>
          <a
            href="#services"
            onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}
            className="mt-10 inline-block bg-red text-white text-base font-medium px-10 py-4 rounded-full hover:bg-red-dark transition-colors"
          >
            View Services
          </a>
        </div>
      </section>

      {/* About */}
      <section id="about" className="max-w-7xl mx-auto px-6 py-24 scroll-mt-20">
        <h2 className="text-3xl md:text-4xl font-semibold text-white">About SkyReach Visuals</h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="aspect-video rounded-2xl overflow-hidden bg-black/40">
            <img src="/skyreach_aboutme_image.png" alt="SkyReach Visuals" className="w-full h-full object-cover" loading="lazy" decoding="async" />
          </div>
          <div>
            <p className="text-cream/80 leading-relaxed">
              SkyReach Visuals is a Bournemouth-based drone photography service providing high-quality aerial photos and video for businesses, property owners and construction projects. Using professional DJI drone technology, we capture unique perspectives that help showcase properties, inspect hard-to-reach areas and create engaging visual content.
            </p>
            <p className="mt-4 text-cream/80 leading-relaxed">
              We hold a current CAA Operational Authorisation and carry full public liability insurance. Every shoot is planned, risk-assessed, and delivered to a broadcast-ready standard.
            </p>
          </div>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-lg font-semibold text-white">Cinematic quality</h3>
            <p className="mt-3 text-cream/70 leading-relaxed text-sm">We shoot in 4K with professional-grade drones. Every clip is colour-graded and edited to a high standard.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Fast & Affordable</h3>
            <p className="mt-3 text-cream/70 leading-relaxed text-sm">Quick turnaround and competitive pricing for inspections, property photography and business content.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Reliable delivery</h3>
            <p className="mt-3 text-cream/70 leading-relaxed text-sm">We give you a delivery date and we stick to it. Standard turnaround 3–7 working days.</p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="max-w-7xl mx-auto px-6 py-24 scroll-mt-20">
        <p className="text-lg text-red font-medium">Starting from £24.99</p>
        <h2 className="mt-2 text-4xl md:text-5xl font-bold text-white">Services</h2>
        <p className="mt-4 text-cream/70 max-w-2xl">
          Every package includes a fully licensed, CAA-certified drone operator,
          professional editing, and delivery in broadcast-ready formats.
        </p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {SERVICES.map((s) => (
            <div key={s.title} className="bg-bg-card p-8 rounded-2xl border border-white/5">
              <h3 className="text-xl font-semibold text-white">{s.title}</h3>
              <p className="mt-3 text-cream/80 text-sm leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
        <Link
          to="/get-started"
          className="mt-10 inline-block bg-red text-white text-sm font-medium px-10 py-4 rounded-full hover:bg-red-dark transition-colors"
        >
          Get Started
        </Link>
      </section>

      {/* Portfolio */}
      <section id="portfolio" className="bg-bg-elevated rounded-3xl mx-4 md:mx-6 py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-semibold text-white">Portfolio</h2>
          <p className="mt-3 text-cream/70 max-w-2xl">
            A selection of aerial projects from across Bournemouth, Poole, and the Dorset coast.
          </p>
          <div className="mt-10 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setGalleryCategory(cat)}
                className={`text-sm px-4 py-2 transition-colors rounded-xl ${
                  galleryCategory === cat ? 'bg-accent text-white' : 'bg-bg-card text-cream/80 hover:text-white border border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-video bg-black/40 overflow-hidden rounded-2xl bg-cover bg-center"
                style={{ backgroundImage: `url(${GALLERY_POSTER})` }}
              >
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-end p-5">
                  <div className="translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                    <span className="text-xs font-medium text-white/80 uppercase tracking-wider">{item.category}</span>
                    <h3 className="text-white font-medium mt-1">{item.label}</h3>
                  </div>
                </div>
                <span className="absolute bottom-4 left-5 text-xs text-white/60 uppercase tracking-wider group-hover:opacity-0 transition-opacity">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-bg-elevated rounded-3xl mx-4 md:mx-6 py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold text-white">Get in touch</h2>
          <p className="mt-4 text-cream/70 max-w-2xl">
            Got a project in mind? Drop us a message and we&rsquo;ll get back to you within 24 hours.
          </p>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              {contactSuccess ? (
                <div className="bg-bg-card p-8 rounded-2xl border border-white/10">
                  <h3 className="text-xl font-semibold text-white">Message sent</h3>
                  <p className="mt-2 text-cream/70">Thanks for getting in touch. We&rsquo;ll come back to you shortly.</p>
                  <button type="button" onClick={() => setContactSuccess(false)} className="mt-4 text-sm font-medium text-accent border-b-2 border-accent pb-1 hover:border-red hover:text-red transition-colors">
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={contactForm.handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium mb-2">Name</label>
                    <input id="contact-name" name="name" type="text" value={contactForm.values.name} onChange={contactForm.handleChange} className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors text-cream placeholder:text-cream/40 rounded-t-xl" />
                    {contactForm.errors.name && <p className="mt-1 text-xs text-red">{contactForm.errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium mb-2">Email</label>
                    <input id="contact-email" name="email" type="email" value={contactForm.values.email} onChange={contactForm.handleChange} className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors text-cream placeholder:text-cream/40 rounded-t-xl" />
                    {contactForm.errors.email && <p className="mt-1 text-xs text-red">{contactForm.errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="contact-phone" className="block text-sm font-medium mb-2">Phone <span className="text-cream/50">(optional)</span></label>
                    <input id="contact-phone" name="phone" type="tel" value={contactForm.values.phone} onChange={contactForm.handleChange} className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors text-cream placeholder:text-cream/40 rounded-t-xl" />
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium mb-2">Message</label>
                    <textarea id="contact-message" name="message" rows={5} value={contactForm.values.message} onChange={contactForm.handleChange} className="w-full bg-transparent border-b-2 border-white/20 focus:border-accent outline-none py-2 transition-colors resize-none text-cream placeholder:text-cream/40 rounded-t-xl" />
                    {contactForm.errors.message && <p className="mt-1 text-xs text-red">{contactForm.errors.message}</p>}
                  </div>
                  {contactForm.submitError && <p className="text-sm text-red">{contactForm.submitError}</p>}
                  <button type="submit" disabled={contactForm.submitting} className="bg-red text-white text-sm font-medium px-8 py-3 rounded-xl hover:bg-red-dark transition-colors disabled:opacity-50">
                    {contactForm.submitting ? 'Sending...' : 'Send message'}
                  </button>
                </form>
              )}
            </div>
            <div className="space-y-8">
              <div>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-cream/50 mb-3">Email</h3>
                <p className="text-cream">support@skyreachvisuals.co.uk</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-cream/50 mb-3">Phone</h3>
                <p className="text-cream">07877 691861</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-cream/50 mb-3">Location</h3>
                <p className="text-cream">Bournemouth, Dorset, UK</p>
                <p className="mt-1 text-sm text-cream/70">We cover Dorset, Hampshire, and Wiltshire. Further afield by arrangement.</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-cream/50 mb-3">Hours</h3>
                <p className="text-cream">Monday to Friday, 9am – 5pm</p>
                <p className="mt-1 text-sm text-cream/70">Weekend shoots available by prior arrangement.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
