import { Link } from 'react-router-dom';

export default function PackageCard({ name, slug, displayPrice, duration, locations, features, highlighted, compact }) {
  const bg = highlighted ? 'bg-accent text-white' : 'bg-cream-dark text-black-muted';
  const featureColor = highlighted ? 'text-white/80' : 'text-black-muted/70';
  const btnClass = highlighted
    ? 'bg-red text-white hover:bg-red-dark'
    : 'bg-black text-white hover:bg-black-muted';

  return (
    <div className={`${bg} p-8 flex flex-col`}>
      <h3 className="text-2xl font-semibold">{name}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-4xl font-bold">£{displayPrice}</span>
      </div>
      <p className={`mt-2 text-sm ${featureColor}`}>
        {duration} &middot; {locations}
      </p>

      {!compact && (
        <ul className="mt-6 space-y-3 flex-1">
          {features.map((feature) => (
            <li key={feature} className={`text-sm ${featureColor} flex items-start gap-2`}>
              <span className="mt-1 shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 7l3.5 3.5L12 4" />
                </svg>
              </span>
              {feature}
            </li>
          ))}
        </ul>
      )}

      <Link
        to={`/booking/${slug}`}
        className={`mt-8 block text-center text-sm font-medium py-3 px-6 transition-colors ${btnClass}`}
      >
        Book now
      </Link>
    </div>
  );
}
