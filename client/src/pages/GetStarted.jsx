import { Link } from 'react-router-dom';
import AnimateInView from '../components/AnimateInView.jsx';

export default function GetStarted() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24">
      <AnimateInView className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          How can we help?
        </h1>
        <p className="mt-4 text-cream/70 max-w-xl mx-auto">
          Choose the option that best fits your project.
        </p>
      </AnimateInView>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimateInView animation="animate-scale-in" className="animate-delay-1">
        <Link
          to="/quick-pay"
          className="group block bg-bg-card border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center hover:border-accent/40 transition-colors mb-8 md:mb-0"
        >
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Already discussed a project?</h2>
          <p className="mt-2 text-cream/70 text-sm leading-relaxed">
            Pay here with your order number. Log in when prompted to complete payment.
          </p>
          <span className="mt-4 text-sm font-medium text-accent transition-colors">
            Pay here &rarr;
          </span>
        </Link>
        </AnimateInView>

        <AnimateInView animation="animate-scale-in" className="animate-delay-1">
        <Link
          to="/book"
          className="group block bg-bg-card border border-white/10 rounded-2xl p-10 flex flex-col items-center text-center hover:border-red/40 transition-colors"
        >
          <div className="w-16 h-16 rounded-full bg-red/10 flex items-center justify-center mb-6 group-hover:bg-red/20 transition-colors">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Make a Booking</h2>
          <p className="mt-3 text-cream/70 text-sm leading-relaxed">
            Standard drone services with fixed pricing. Roof, gutter and chimney inspections; property aerial photos.
          </p>
          <span className="mt-6 text-sm font-medium text-red group-hover:text-red-dark transition-colors">
            £24.99 &rarr;
          </span>
        </Link>
        </AnimateInView>

        <AnimateInView animation="animate-scale-in" className="animate-delay-2">
        <Link
          to="/quote"
          className="group block bg-bg-card border border-white/10 rounded-2xl p-10 flex flex-col items-center text-center hover:border-accent/40 transition-colors"
        >
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Get A Quote</h2>
          <p className="mt-3 text-cream/70 text-sm leading-relaxed">
            Custom projects, commercial work, events, or anything that needs a tailored approach. Tell us what you need and we&rsquo;ll quote you.
          </p>
          <span className="mt-6 text-sm font-medium text-accent transition-colors">
            Request a quote &rarr;
          </span>
        </Link>
        </AnimateInView>
      </div>
    </div>
  );
}
