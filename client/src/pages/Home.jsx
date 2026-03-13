import { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from '../hooks/useForm.js';
import { useAuth } from '../hooks/useAuth.js';
import { api } from '../api/client.js';
import AnimateInView from '../components/AnimateInView.jsx';

const HERO_VIDEO = '/media/hero-bg.mp4';

const SERVICES = [
  { title: 'Roof Inspection', description: 'Aerial roof check using drone. Identify damage, leaks, or missing tiles. Includes photos and short video.' },
  { title: 'Property Aerial Photos', description: 'Professional aerial photos of your property. Fully edited and colour graded. High-quality images delivered digitally.' },
  { title: 'Inspection packages', description: 'Gutter and chimney inspections. Safe, no ladders. Fixed prices — book online or get a quote for custom projects.' },
];

const PLACEHOLDER_REVIEWS = [
  { id: 'p1', name: 'James H.', rating: 5, comment: 'Brilliant aerial shots of our property. The team was professional, turned up on time, and the turnaround was incredibly quick. We got the edited photos within a few days and they made our listing look fantastic. Couldn\'t ask for more — will definitely use SkyReach again for our next project.', createdAt: '2023-10-10T12:00:00Z' },
  { id: 'p2', name: 'Sarah M.', rating: 5, comment: 'We used SkyReach for our roof inspection and it was a game-changer. Saved us the cost of scaffolding and the photos were crystal clear. The report they provided helped our builder identify exactly what needed fixing. Highly professional and great value for money.', createdAt: '2023-09-09T12:00:00Z' },
  { id: 'p3', name: 'Tom R.', rating: 4, comment: 'Great quality drone footage for our estate listing. Really helped the property stand out online and we had a lot of interest from buyers. The only reason I\'m not giving five stars is we had to reschedule once due to weather, but they were very flexible and the final result was worth the wait.', createdAt: '2023-10-30T12:00:00Z' },
  { id: 'p4', name: 'Emily P.', rating: 5, comment: 'Fantastic experience from start to finish. The aerial photos made our Airbnb listing look amazing and we\'ve had so many compliments from guests. The team was friendly, efficient, and the quality was exactly what we wanted. Would recommend to anyone needing property or event photography.', createdAt: '2023-08-15T12:00:00Z' },
  { id: 'p5', name: 'David L.', rating: 5, comment: 'Professional, reliable, and affordable. We\'ve used SkyReach for several projects now — property shots, a construction progress film, and a few marketing clips. Every time they deliver on time and the quality is consistently high. Would highly recommend for any property or business photography needs.', createdAt: '2023-11-01T12:00:00Z' },
  { id: 'p6', name: 'Rachel K.', rating: 4, comment: 'Quick turnaround on our construction site survey. The drone footage was exactly what we needed for the client presentation and the team worked around our schedule. Clear communication and fair pricing. We\'ll be using them again for the next phase of the build.', createdAt: '2023-09-22T12:00:00Z' },
];

function StarRating({ rating, light }) {
  const starClass = light ? (n) => (n <= rating ? 'text-amber-300' : 'text-white/30') : (n) => (n <= rating ? 'text-amber-500' : 'text-gray-300');
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} className={`w-4 h-4 ${starClass(n)}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

const COMMENT_PREVIEW_LEN = 120;

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

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function Home() {
  const location = useLocation();
  const { user } = useAuth();
  const [galleryCategory, setGalleryCategory] = useState('All');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const [reviews, setReviews] = useState(PLACEHOLDER_REVIEWS);
  const [reviewExpandedId, setReviewExpandedId] = useState(null);
  const testimonialsScrollRef = useRef(null);

  useEffect(() => {
    api.get('/api/reviews/public')
      .then((data) => { if (data?.length > 0) setReviews(data); })
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
      {/* Hero — video fills whole screen from top, no gap above; keep text light on video in both themes */}
      <section className="hero-on-dark relative min-h-screen flex items-center justify-center overflow-hidden bg-black rounded-b-3xl -mt-20">
        <video
          src={HERO_VIDEO}
          poster="/media/hero-poster.jpg"
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
        <div className={`relative z-10 max-w-5xl mx-auto px-6 py-24 text-center flex flex-col items-center justify-center ${heroVideoReady ? 'animate-fade-in' : 'opacity-0'}`}>
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
            className="mt-10 inline-block bg-gradient-to-r from-red to-red-dark text-white text-base font-medium px-10 py-4 rounded-full hover:opacity-95 transition-opacity shadow-lg shadow-red/25"
          >
            View Services
          </a>
        </div>
      </section>

      {/* About */}
      <AnimateInView as="section" id="about" className="max-w-7xl mx-auto px-6 py-24 scroll-mt-20" animation="animate-slide-in-right">
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
          <div className="p-5 rounded-2xl border-2 border-emerald-500/50 bg-bg-card/50 cursor-default">
            <h3 className="text-lg font-semibold text-white text-accent-light">Cinematic quality</h3>
            <p className="mt-3 text-cream/70 leading-relaxed text-sm">We shoot in 4K with professional-grade drones. Every clip is colour-graded and edited to a high standard.</p>
          </div>
          <div className="p-5 rounded-2xl border-2 border-blue-500/50 bg-bg-card/50 cursor-default">
            <h3 className="text-lg font-semibold text-white text-red-light">Fast & Affordable</h3>
            <p className="mt-3 text-cream/70 leading-relaxed text-sm">Quick turnaround and competitive pricing for inspections, property photography and business content.</p>
          </div>
          <div className="p-5 rounded-2xl border-2 border-red/50 bg-bg-card/50 cursor-default">
            <h3 className="text-lg font-semibold text-white text-emerald-400">Reliable delivery</h3>
            <p className="mt-3 text-cream/70 leading-relaxed text-sm">We give you a delivery date and we stick to it. Standard turnaround 3–7 working days.</p>
          </div>
        </div>
      </AnimateInView>

      {/* Services */}
      <AnimateInView as="section" id="services" className="max-w-7xl mx-auto px-6 py-24 scroll-mt-24" animation="animate-slide-in-left">
        <h2 className="text-3xl md:text-4xl font-semibold text-white mb-2">Services</h2>
        <p className="text-lg text-cream/70 font-medium">
          Fixed-price packages
        </p>
        <p className="mt-4 text-cream/70 max-w-2xl">
          Every package includes a fully licensed, CAA-certified drone operator,
          professional editing, and delivery in broadcast-ready formats.
        </p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {SERVICES.map((s) => (
            <div key={s.title} className="bg-bg-card p-8 rounded-2xl border border-white/10 cursor-default">
              <h3 className="text-xl font-semibold text-white text-accent-light">{s.title}</h3>
              <p className="mt-3 text-cream/80 text-sm leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
        <Link
          to="/get-started"
          className="mt-10 inline-block bg-gradient-to-r from-red to-red-dark text-white text-sm font-medium px-10 py-4 rounded-full hover:opacity-95 transition-opacity shadow-lg shadow-red/20"
        >
          Get Started
        </Link>
      </AnimateInView>

      {/* Testimonials — Gmail/outlook-style card strip, one highlighted blue card */}
      <AnimateInView as="section" id="reviews" className="bg-white py-24 scroll-mt-20" animation="animate-slide-in-right">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-serif text-gray-900 text-center">Testimonials</h2>
          <p className="mt-3 text-gray-500 text-center max-w-2xl mx-auto">
            Real feedback from customers who have used our drone photography services.
          </p>
          <div className="mt-12 relative">
            <div
              ref={testimonialsScrollRef}
              className="flex gap-6 overflow-x-auto overflow-y-hidden pb-4 snap-x snap-mandatory scroll-smooth scrollbar-thin"
              style={{ scrollbarWidth: 'thin' }}
            >
              {reviews.map((r, i) => {
                const isHighlight = i === 0;
                const expanded = reviewExpandedId === r.id;
                const showReadMore = (r.comment?.length || 0) > COMMENT_PREVIEW_LEN && !expanded;
                const displayComment = expanded ? r.comment : (r.comment?.slice(0, COMMENT_PREVIEW_LEN) || '');
                const dateStr = r.createdAt
                  ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')
                  : '';
                const initial = (r.name || '?').charAt(0).toUpperCase();
                return (
                  <div
                    key={r.id}
                    className={`shrink-0 w-[300px] md:w-[320px] snap-center rounded-xl shadow-md flex flex-col p-6 min-h-[280px] ${!isHighlight ? 'bg-gray-100' : ''}`}
                    style={isHighlight ? { backgroundColor: '#2563eb' } : undefined}
                  >
                    <div className={`flex items-start gap-3 ${isHighlight ? 'text-white' : 'text-gray-900'}`}>
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold shrink-0 ${isHighlight ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-700'}`}
                      >
                        {initial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{r.name}</p>
                        <div className="mt-1">
                          <StarRating rating={r.rating ?? 5} light={isHighlight} />
                        </div>
                      </div>
                    </div>
                    <div className={`mt-4 flex-1 flex flex-col ${isHighlight ? 'text-white/95' : 'text-gray-700'}`}>
                      <p className="text-sm leading-relaxed">
                        {displayComment}
                        {showReadMore && (
                          <>
                            {' … '}
                            <button
                              type="button"
                              onClick={() => setReviewExpandedId(r.id)}
                              className="underline font-medium hover:opacity-90"
                            >
                              Read more
                            </button>
                          </>
                        )}
                      </p>
                      {dateStr && (
                        <p className={`mt-auto pt-4 text-right text-xs ${isHighlight ? 'text-white/80' : 'text-gray-500'}`}>
                          {dateStr}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {reviews.length > 1 && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => testimonialsScrollRef.current?.scrollBy({ left: -340, behavior: 'smooth' })}
                  className="w-11 h-11 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center shadow-sm"
                  aria-label="Previous testimonials"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => testimonialsScrollRef.current?.scrollBy({ left: 340, behavior: 'smooth' })}
                  className="w-11 h-11 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center shadow-sm"
                  aria-label="Next testimonials"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </AnimateInView>

      {/* Portfolio */}
      <AnimateInView as="section" id="portfolio" className="max-w-7xl mx-auto px-6 py-24 scroll-mt-20" animation="animate-slide-in-left">
        <div>
          <h2 className="text-3xl md:text-4xl font-semibold text-white">Portfolio</h2>
          <p className="mt-3 text-cream/70 max-w-2xl">
            A selection of aerial projects from across Bournemouth, Poole, and the Dorset coast.
          </p>
          <div className="mt-10 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setGalleryCategory(cat)}
                className={`text-sm px-4 py-2 transition-all duration-200 rounded-xl ${
                  galleryCategory === cat
                    ? 'bg-gradient-to-r from-accent to-accent-light text-white shadow-lg shadow-accent/25'
                    : 'bg-bg-card text-cream/80 hover:text-white hover:border-accent/40 border border-white/10'
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-accent/30 group-hover:via-black/40 group-hover:to-transparent transition-all duration-300 flex items-end p-5">
                  <div className="translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <span className="text-xs font-medium text-accent-light uppercase tracking-wider">{item.category}</span>
                    <h3 className="text-white font-medium mt-1">{item.label}</h3>
                  </div>
                </div>
                <span className="absolute bottom-4 left-5 text-xs text-white/60 uppercase tracking-wider group-hover:opacity-0 transition-opacity">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </AnimateInView>

      {/* Contact */}
      <AnimateInView as="section" id="contact" className="max-w-7xl mx-auto px-6 py-24 scroll-mt-20" animation="animate-slide-in-right">
        <div>
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
                  <button type="submit" disabled={contactForm.submitting} className="bg-gradient-to-r from-red to-red-dark text-white text-sm font-medium px-8 py-3 rounded-xl hover:opacity-95 transition-opacity shadow-lg shadow-red/20 disabled:opacity-50">
                    {contactForm.submitting ? 'Sending...' : 'Send message'}
                  </button>
                </form>
              )}
            </div>
            <div className="space-y-8">
              <div>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-accent-light/80 mb-3">Email</h3>
                <a href="mailto:support@skyreachvisuals.co.uk" className="text-cream hover:text-accent-light transition-colors">support@skyreachvisuals.co.uk</a>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-accent-light/80 mb-3">Phone</h3>
                <a href="tel:+4407877691861" className="text-cream hover:text-accent-light transition-colors">07877 691861</a>
              </div>
              <div>
                <h3 className="text-xs font-semibold tracking-widest uppercase text-accent-light/80 mb-3">Location</h3>
                <p className="text-cream">Bournemouth, Dorset, UK</p>
                <p className="mt-1 text-sm text-cream/70">We cover Dorset, Hampshire, and Wiltshire. Further afield by arrangement.</p>
              </div>
            </div>
          </div>
        </div>
      </AnimateInView>
    </>
  );
}
