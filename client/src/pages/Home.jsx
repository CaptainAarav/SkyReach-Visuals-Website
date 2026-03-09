import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from '../hooks/useForm.js';
import { useAuth } from '../hooks/useAuth.js';
import { api } from '../api/client.js';
import AnimateInView from '../components/AnimateInView.jsx';
import CountUp from '../components/CountUp.jsx';

const HERO_VIDEO = '/media/hero-bg.mp4';

const SERVICES = [
  { title: 'Property Roof Inspections', description: 'Comprehensive aerial photos to safely inspect roofs without ladders or scaffolding.' },
  { title: 'Property Aerial Photos', description: 'High-quality aerial photos for homes, property listings and estate marketing.' },
];

const PLACEHOLDER_REVIEWS = [
  { id: 'p1', name: 'James H.', rating: 5, comment: 'Brilliant aerial shots of our property. The team was professional, turned up on time, and the turnaround was incredibly quick. We got the edited photos within a few days and they made our listing look fantastic. Couldn\'t ask for more — will definitely use SkyReach again for our next project.' },
  { id: 'p2', name: 'Sarah M.', rating: 5, comment: 'We used SkyReach for our roof inspection and it was a game-changer. Saved us the cost of scaffolding and the photos were crystal clear. The report they provided helped our builder identify exactly what needed fixing. Highly professional and great value for money.' },
  { id: 'p3', name: 'Tom R.', rating: 4, comment: 'Great quality drone footage for our estate listing. Really helped the property stand out online and we had a lot of interest from buyers. The only reason I\'m not giving five stars is we had to reschedule once due to weather, but they were very flexible and the final result was worth the wait.' },
  { id: 'p4', name: 'Emily P.', rating: 5, comment: 'Fantastic experience from start to finish. The aerial photos made our Airbnb listing look amazing and we\'ve had so many compliments from guests. The team was friendly, efficient, and the quality was exactly what we wanted. Would recommend to anyone needing property or event photography.' },
  { id: 'p5', name: 'David L.', rating: 5, comment: 'Professional, reliable, and affordable. We\'ve used SkyReach for several projects now — property shots, a construction progress film, and a few marketing clips. Every time they deliver on time and the quality is consistently high. Would highly recommend for any property or business photography needs.' },
  { id: 'p6', name: 'Rachel K.', rating: 4, comment: 'Quick turnaround on our construction site survey. The drone footage was exactly what we needed for the client presentation and the team worked around our schedule. Clear communication and fair pricing. We\'ll be using them again for the next phase of the build.' },
];

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} className={`w-4 h-4 ${n <= rating ? 'text-amber-400' : 'text-white/20'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

const GALLERY_VIDEO = '/media/paul-srv.mp4';
const GALLERY_POSTER = '/media/gallery-poster.jpg';
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

const ABOUT_VIDEO = '/media/paul-srv.mp4';

/** Per-card hover rotation (any direction) so the carousel feels less uniform */
const REVIEW_HOVER_ROTATIONS = ['hover:rotate-1', 'hover:-rotate-1', 'hover:rotate-2', 'hover:-rotate-2', 'hover:rotate-1', 'hover:-rotate-2'];

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function Home() {
  const location = useLocation();
  const { user } = useAuth();
  const [galleryCategory, setGalleryCategory] = useState('All');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const [reviews, setReviews] = useState(PLACEHOLDER_REVIEWS);
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    api.get('/api/reviews/public')
      .then((data) => { if (data.length > 0) setReviews(data); })
      .catch(() => {});
  }, []);

  const contactForm = useForm({
    initialValues: { name: user?.name || '', email: user?.email || '', phone: '', message: '' },
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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black -mt-20">
        <video
          src={HERO_VIDEO}
          poster="/media/hero-poster.jpg"
          className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-1000 transform-gpu ${heroVideoReady ? 'opacity-100' : 'opacity-0'}`}
          muted
          playsInline
          loop
          autoPlay
          preload="auto"
          fetchpriority="high"
          aria-hidden
          onCanPlay={() => setHeroVideoReady(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70 pointer-events-none" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-transparent to-red/10 pointer-events-none" aria-hidden />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-[10%] w-64 h-64 bg-accent/20 rounded-full blur-[100px] animate-float-slow pointer-events-none" aria-hidden />
        <div className="absolute bottom-1/4 right-[10%] w-48 h-48 bg-red/15 rounded-full blur-[80px] animate-pulse-glow pointer-events-none" style={{ animationDelay: '2s' }} aria-hidden />

        <div className={`relative z-10 max-w-5xl mx-auto px-6 py-24 text-center flex flex-col items-center justify-center ${heroVideoReady ? 'animate-fade-in' : 'opacity-0'}`}>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold leading-tight text-gradient drop-shadow-2xl" style={{ letterSpacing: '0.2em' }}>
            SkyReach Visuals
          </h1>
          <p className="subtitle mt-5 text-2xl sm:text-3xl md:text-4xl text-white/90 animate-fade-in-up animate-delay-2">
            Drone Photography in Bournemouth
          </p>
          <p className="mt-6 text-xl md:text-2xl text-white/70 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animate-delay-3">
            Affordable aerial photos and videos for property, roof inspections and businesses.
          </p>
          <a
            href="#services"
            onClick={(e) => { e.preventDefault(); scrollToSection('services'); }}
            className="group mt-10 inline-flex items-center gap-2 bg-gradient-to-r from-red via-red-light to-red text-white text-base font-semibold px-10 py-4 rounded-full transition-all duration-300 shadow-lg shadow-red/30 hover:shadow-[0_0_40px_rgba(220,38,38,0.5)] hover:scale-[1.04] animate-gradient-x animate-fade-in-up animate-delay-4"
          >
            View Services
            <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </a>
        </div>

        {/* Bottom fade into page */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg to-transparent pointer-events-none" aria-hidden />
      </section>

      <AnimateInView as="section" id="about" className="relative max-w-7xl mx-auto px-6 py-28 scroll-mt-20" animation="animate-slide-in-right">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-accent/5 rounded-full blur-[120px] pointer-events-none" aria-hidden />
        <h2 className="text-3xl md:text-4xl font-semibold text-white border-l-4 border-accent pl-4">About SkyReach Visuals</h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="aspect-video rounded-2xl overflow-hidden bg-black/40 group">
            <img src="/skyreach_aboutme_image.png" alt="SkyReach Visuals" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" decoding="async" />
          </div>
          <div>
            <p className="text-cream/75 leading-relaxed">
              SkyReach Visuals is a Bournemouth-based drone photography service providing high-quality aerial photos and video for businesses, property owners and construction projects. Using professional DJI drone technology, we capture unique perspectives that help showcase properties, inspect hard-to-reach areas and create engaging visual content.
            </p>
            <p className="mt-4 text-cream/75 leading-relaxed">
              We hold a current CAA Operational Authorisation and carry full public liability insurance. Every shoot is planned, risk-assessed, and delivered to a broadcast-ready standard.
            </p>
          </div>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group p-6 rounded-2xl border border-white/[0.06] bg-bg-card/60 backdrop-blur-sm hover:border-accent/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(124,58,237,0.12)]">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <svg className="w-5 h-5 text-accent-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-lg font-semibold text-accent-light">Cinematic quality</h3>
            <p className="mt-3 text-cream/60 leading-relaxed text-sm">We shoot in 4K with professional-grade drones. Every clip is colour-graded and edited to a high standard.</p>
          </div>
          <div className="group p-6 rounded-2xl border border-white/[0.06] bg-bg-card/60 backdrop-blur-sm hover:border-red/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(220,38,38,0.12)]">
            <div className="w-10 h-10 rounded-xl bg-red/10 flex items-center justify-center mb-4 group-hover:bg-red/20 transition-colors">
              <svg className="w-5 h-5 text-red-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="text-lg font-semibold text-red-light">Fast & Affordable</h3>
            <p className="mt-3 text-cream/60 leading-relaxed text-sm">Quick turnaround and competitive pricing for inspections, property photography and business content.</p>
          </div>
          <div className="group p-6 rounded-2xl border border-white/[0.06] bg-bg-card/60 backdrop-blur-sm hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(16,185,129,0.12)]">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-lg font-semibold text-emerald-400">Reliable delivery</h3>
            <p className="mt-3 text-cream/60 leading-relaxed text-sm">We give you a delivery date and we stick to it. Standard turnaround 3–7 working days.</p>
          </div>
        </div>
      </AnimateInView>

      <AnimateInView as="section" id="services" className="relative max-w-7xl mx-auto px-6 py-28 scroll-mt-20" animation="animate-slide-in-left">
        <div className="absolute -top-10 -right-20 w-72 h-72 bg-red/5 rounded-full blur-[120px] pointer-events-none" aria-hidden />
        <h2 className="text-3xl md:text-4xl font-semibold text-white border-l-4 border-red pl-4 mb-2">Services</h2>
        <p className="text-lg text-red-light font-semibold">
          <CountUp value={35} decimals={2} duration={1200} prefix="£" />
        </p>
        <p className="mt-4 text-cream/60 max-w-2xl">
          Every package includes a fully licensed, CAA-certified drone operator,
          professional editing, and delivery in broadcast-ready formats.
        </p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {SERVICES.map((s) => (
            <div key={s.title} className="group relative bg-bg-card/80 p-8 rounded-2xl border border-white/[0.06] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_12px_48px_rgba(124,58,237,0.15)] overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-accent via-accent-light to-accent opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
              <h3 className="text-xl font-semibold text-accent-light">{s.title}</h3>
              <p className="mt-3 text-cream/60 text-sm leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
        <Link
          to="/get-started"
          className="group mt-10 inline-flex items-center gap-2 bg-gradient-to-r from-red via-red-light to-red text-white text-sm font-semibold px-10 py-4 rounded-full transition-all duration-300 shadow-lg shadow-red/25 hover:shadow-[0_0_40px_rgba(220,38,38,0.4)] hover:scale-[1.03] animate-gradient-x"
        >
          Get Started
          <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </Link>
      </AnimateInView>

      <AnimateInView as="section" id="reviews" className="relative max-w-7xl mx-auto px-6 py-28 scroll-mt-20" animation="animate-slide-in-right">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-400/[0.03] rounded-full blur-[150px] pointer-events-none" aria-hidden />
        <h2 className="text-3xl md:text-4xl font-semibold text-white border-l-4 border-amber-400 pl-4">What People Think About Us</h2>
        <p className="mt-3 text-cream/60 max-w-2xl">
          Real feedback from verified customers who have used our drone photography services.
        </p>
        <div className="mt-12">
          <div className="min-w-0 overflow-hidden py-6">
            <div
              className="flex transition-[transform] duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
              style={{ transform: `translateX(-${reviewIndex * 100}%)` }}
            >
              {reviews.map((r, i) => (
                <div key={r.id} className="w-full shrink-0 px-3">
                  <div className={`review-card isolate bg-bg-card/70 backdrop-blur-sm p-8 md:p-12 rounded-2xl border border-white/[0.06] flex flex-col gap-6 min-h-[300px] md:min-h-[340px] cursor-default transition-all duration-500 ease-out hover:-translate-y-2 ${REVIEW_HOVER_ROTATIONS[i % REVIEW_HOVER_ROTATIONS.length]} hover:border-amber-400/20 hover:shadow-[0_12px_48px_rgba(251,191,36,0.1)]`}>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-base md:text-lg font-semibold text-white">{r.name}</span>
                        <span className="verified-badge group/verified relative inline-flex shrink-0 cursor-help" title="Verified Purchase">
                          <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                          <span className="verified-tooltip pointer-events-none absolute left-1/2 bottom-full -translate-x-1/2 mb-1.5 px-2 py-1 text-xs font-medium text-white bg-neutral-800 rounded shadow-lg whitespace-nowrap opacity-0 invisible group-hover/verified:opacity-100 group-hover/verified:visible transition-all duration-150 z-10">
                            Verified Purchase
                          </span>
                        </span>
                      </div>
                      <StarRating rating={r.rating} />
                    </div>
                    <p className="text-cream/80 text-base md:text-lg leading-relaxed flex-1">{r.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {reviews.length > 1 && (
            <div className="mt-8 flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={() => setReviewIndex((i) => (i <= 0 ? reviews.length - 1 : i - 1))}
                className="w-12 h-12 rounded-full bg-bg-card/80 border border-white/10 text-white hover:bg-accent/20 hover:border-accent/40 hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] transition-all duration-300 flex items-center justify-center"
                aria-label="Previous review"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <p className="text-sm text-cream/50 min-w-[4rem] text-center">
                <CountUp key={`cur-${reviewIndex}`} value={reviewIndex + 1} duration={600} /> of <CountUp value={reviews.length} duration={800} />
              </p>
              <button
                type="button"
                onClick={() => setReviewIndex((i) => (i >= reviews.length - 1 ? 0 : i + 1))}
                className="w-12 h-12 rounded-full bg-bg-card/80 border border-white/10 text-white hover:bg-accent/20 hover:border-accent/40 hover:shadow-[0_0_20px_rgba(124,58,237,0.2)] transition-all duration-300 flex items-center justify-center"
                aria-label="Next review"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </AnimateInView>

      <AnimateInView as="section" id="portfolio" className="relative max-w-7xl mx-auto px-6 py-28 scroll-mt-20" animation="animate-slide-in-left">
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-accent/5 rounded-full blur-[120px] pointer-events-none" aria-hidden />
        <div>
          <h2 className="text-3xl md:text-4xl font-semibold text-white border-l-4 border-accent pl-4">Portfolio</h2>
          <p className="mt-3 text-cream/60 max-w-2xl">
            A selection of aerial projects from across Bournemouth, Poole, and the Dorset coast.
          </p>
          <div className="mt-10 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setGalleryCategory(cat)}
                className={`text-sm px-5 py-2.5 transition-all duration-300 rounded-full font-medium ${
                  galleryCategory === cat
                    ? 'bg-gradient-to-r from-accent to-accent-light text-white shadow-[0_0_20px_rgba(124,58,237,0.3)]'
                    : 'bg-white/[0.04] text-cream/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]'
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
                className="group relative aspect-video bg-black/40 overflow-hidden rounded-2xl bg-cover bg-center transition-transform duration-500 hover:scale-[1.02]"
                style={{ backgroundImage: `url(${GALLERY_POSTER})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-accent/20 group-hover:via-black/50 group-hover:to-transparent transition-all duration-500 flex items-end p-5">
                  <div className="translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <span className="text-xs font-semibold text-accent-light uppercase tracking-wider">{item.category}</span>
                    <h3 className="text-white font-medium mt-1">{item.label}</h3>
                  </div>
                </div>
                <span className="absolute bottom-4 left-5 text-xs text-white/50 uppercase tracking-wider group-hover:opacity-0 transition-opacity duration-300">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </AnimateInView>

      <AnimateInView as="section" id="contact" className="relative max-w-7xl mx-auto px-6 py-28 scroll-mt-20" animation="animate-slide-in-right">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-red/[0.04] rounded-full blur-[150px] pointer-events-none" aria-hidden />
        <div>
          <h2 className="text-4xl md:text-5xl font-bold text-white border-l-4 border-red pl-4">Get in touch</h2>
          <p className="mt-4 text-cream/60 max-w-2xl">
            Got a project in mind? Drop us a message and we&rsquo;ll get back to you within 24 hours.
          </p>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              {contactSuccess ? (
                <div className="glass p-8 rounded-2xl glow-accent">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white">Message sent</h3>
                  <p className="mt-2 text-cream/60">Thanks for getting in touch. We&rsquo;ll come back to you shortly.</p>
                  <button type="button" onClick={() => setContactSuccess(false)} className="mt-6 text-sm font-medium text-accent-light hover:text-white transition-colors">
                    Send another message &rarr;
                  </button>
                </div>
              ) : (
                <form onSubmit={contactForm.handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium mb-2 text-cream/70">Name</label>
                    <input id="contact-name" name="name" type="text" value={contactForm.values.name} onChange={contactForm.handleChange} className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-accent/50 focus:bg-white/[0.05] outline-none py-3 px-4 transition-all duration-300 text-cream placeholder:text-cream/30 rounded-xl focus:shadow-[0_0_20px_rgba(124,58,237,0.1)]" />
                    {contactForm.errors.name && <p className="mt-1 text-xs text-red">{contactForm.errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium mb-2 text-cream/70">Email</label>
                    <input id="contact-email" name="email" type="email" value={contactForm.values.email} onChange={contactForm.handleChange} className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-accent/50 focus:bg-white/[0.05] outline-none py-3 px-4 transition-all duration-300 text-cream placeholder:text-cream/30 rounded-xl focus:shadow-[0_0_20px_rgba(124,58,237,0.1)]" />
                    {contactForm.errors.email && <p className="mt-1 text-xs text-red">{contactForm.errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="contact-phone" className="block text-sm font-medium mb-2 text-cream/70">Phone <span className="text-cream/40">(optional)</span></label>
                    <input id="contact-phone" name="phone" type="tel" value={contactForm.values.phone} onChange={contactForm.handleChange} className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-accent/50 focus:bg-white/[0.05] outline-none py-3 px-4 transition-all duration-300 text-cream placeholder:text-cream/30 rounded-xl focus:shadow-[0_0_20px_rgba(124,58,237,0.1)]" />
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium mb-2 text-cream/70">Message</label>
                    <textarea id="contact-message" name="message" rows={5} value={contactForm.values.message} onChange={contactForm.handleChange} className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-accent/50 focus:bg-white/[0.05] outline-none py-3 px-4 transition-all duration-300 resize-none text-cream placeholder:text-cream/30 rounded-xl focus:shadow-[0_0_20px_rgba(124,58,237,0.1)]" />
                    {contactForm.errors.message && <p className="mt-1 text-xs text-red">{contactForm.errors.message}</p>}
                  </div>
                  {contactForm.submitError && <p className="text-sm text-red">{contactForm.submitError}</p>}
                  <button type="submit" disabled={contactForm.submitting} className="group bg-gradient-to-r from-red via-red-light to-red text-white text-sm font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-red/20 hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:scale-[1.02] animate-gradient-x disabled:opacity-50">
                    {contactForm.submitting ? 'Sending...' : 'Send message'}
                  </button>
                </form>
              )}
            </div>
            <div className="space-y-8">
              <div className="group">
                <h3 className="text-xs font-semibold tracking-widest uppercase text-accent-light/60 mb-3">Email</h3>
                <a href="mailto:support@skyreachvisuals.co.uk" className="text-cream/80 hover:text-accent-light transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(167,139,250,0.4)]">support@skyreachvisuals.co.uk</a>
              </div>
              <div className="group">
                <h3 className="text-xs font-semibold tracking-widest uppercase text-accent-light/60 mb-3">Phone</h3>
                <a href="tel:+4407877691861" className="text-cream/80 hover:text-accent-light transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(167,139,250,0.4)]">07877 691861</a>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-accent-light/60 mb-3">Location</h3>
                <p className="text-cream/80">Bournemouth, Dorset, UK</p>
                <p className="mt-1 text-sm text-cream/50">We cover Dorset, Hampshire, and Wiltshire. Further afield by arrangement.</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-accent-light/60 mb-3">Hours</h3>
                <p className="text-cream/80">Monday to Friday, 9am – 5pm</p>
                <p className="mt-1 text-sm text-cream/50">Weekend shoots available by prior arrangement.</p>
              </div>
            </div>
          </div>
        </div>
      </AnimateInView>
    </>
  );
}
