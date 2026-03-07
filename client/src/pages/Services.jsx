import { Link } from 'react-router-dom';
import { PACKAGES } from '../data/packages.js';
import PackageCard from '../components/PackageCard.jsx';

const SERVICES_LIST = [
  'Property aerial photography & videography',
  'Roof inspections & surveys',
  'Commercial & business aerial footage',
  'Event coverage (festivals, sports, weddings)',
  'Construction progress filming',
  'Estate agent & lettings photography',
  'Tourism & destination films',
  'Custom cinematic packages',
];

export default function Services() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-24">
      <p className="text-lg text-red font-medium">Starting from £24.99</p>
      <h1 className="mt-2 text-4xl md:text-5xl font-bold text-black">Our services</h1>
      <p className="mt-4 text-black-muted/70 max-w-2xl leading-relaxed">
        Every package includes a fully licensed, CAA-certified drone operator,
        professional editing, and delivery in broadcast-ready formats. No hidden
        costs, no surprise fees.
      </p>

      <ul className="mt-12 space-y-3 max-w-2xl">
        {SERVICES_LIST.map((service) => (
          <li key={service} className="flex items-center gap-3 text-black-muted">
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-accent" aria-hidden />
            {service}
          </li>
        ))}
      </ul>

      <h2 className="mt-16 text-2xl font-semibold text-black">Packages</h2>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {PACKAGES.map((pkg) => (
          <PackageCard key={pkg.slug} {...pkg} />
        ))}
      </div>

      <div className="mt-24 text-center">
        <p className="text-black-muted/70 max-w-xl mx-auto">
          Need something bespoke? We regularly work on multi-day shoots, recurring
          contracts, and specialist projects. We&rsquo;ll put together a quote
          based on your exact requirements.
        </p>
        <Link
          to="/contact"
          className="mt-8 inline-block bg-red text-white text-sm font-medium px-10 py-4 hover:bg-red-dark transition-colors"
        >
          Get a quote
        </Link>
      </div>
    </div>
  );
}
