import { Link } from 'react-router-dom';

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
      <h1 className="mt-2 text-4xl md:text-5xl font-bold text-white">Our services</h1>
      <p className="mt-4 text-cream/70 max-w-2xl leading-relaxed">
        Every package includes a fully licensed, CAA-certified drone operator,
        professional editing, and delivery in broadcast-ready formats. No hidden
        costs, no surprise fees.
      </p>

      <ul className="mt-12 space-y-3 max-w-2xl">
        {SERVICES_LIST.map((service) => (
          <li key={service} className="flex items-center gap-3 text-cream/80">
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-accent" aria-hidden />
            {service}
          </li>
        ))}
      </ul>

      <div className="mt-12">
        <Link
          to="/quote"
          className="inline-block bg-red text-white text-sm font-medium px-10 py-4 rounded-full hover:bg-red-dark transition-colors"
        >
          Get a quote
        </Link>
      </div>
    </div>
  );
}
