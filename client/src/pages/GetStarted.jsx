import { Link } from 'react-router-dom';
import AnimateInView from '../components/AnimateInView.jsx';
import CountUp from '../components/CountUp.jsx';

export default function GetStarted() {
  return (
    <div className="relative max-w-4xl mx-auto px-6 py-28">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-accent/[0.04] rounded-full blur-[150px] pointer-events-none" aria-hidden />

      <AnimateInView className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gradient">
          How can we help?
        </h1>
        <p className="mt-4 text-cream/60 max-w-xl mx-auto">
          Choose the option that best fits your project.
        </p>
      </AnimateInView>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimateInView animation="animate-scale-in" className="animate-delay-1">
        <Link
          to="/book"
          className="group relative block bg-bg-card/70 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-10 flex flex-col items-center text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_16px_64px_rgba(220,38,38,0.15)] overflow-hidden"
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-red to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="w-16 h-16 rounded-2xl bg-red/10 flex items-center justify-center mb-6 group-hover:bg-red/20 group-hover:shadow-[0_0_30px_rgba(220,38,38,0.2)] transition-all duration-500">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-light">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Book Now</h2>
          <p className="mt-3 text-cream/60 text-sm leading-relaxed">
            Standard drone services with fixed pricing. Property roof inspections and property aerial photos.
          </p>
          <span className="mt-6 text-sm font-semibold text-red-light group-hover:text-white transition-colors">
            <CountUp value={35} decimals={2} prefix="£" duration={1000} /> &rarr;
          </span>
        </Link>
        </AnimateInView>

        <AnimateInView animation="animate-scale-in" className="animate-delay-2">
        <Link
          to="/quote"
          className="group relative block bg-bg-card/70 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-10 flex flex-col items-center text-center transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_16px_64px_rgba(124,58,237,0.15)] overflow-hidden"
        >
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 group-hover:shadow-[0_0_30px_rgba(124,58,237,0.2)] transition-all duration-500">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-light">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Get A Quote</h2>
          <p className="mt-3 text-cream/60 text-sm leading-relaxed">
            Custom projects, commercial work, events, or anything that needs a tailored approach. Tell us what you need and we&rsquo;ll quote you.
          </p>
          <span className="mt-6 text-sm font-semibold text-accent-light group-hover:text-white transition-colors">
            Request a quote &rarr;
          </span>
        </Link>
        </AnimateInView>
      </div>
    </div>
  );
}
