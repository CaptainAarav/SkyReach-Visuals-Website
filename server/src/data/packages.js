export const PACKAGES = [
  {
    name: 'Horizon',
    slug: 'horizon',
    price: 14900,
    duration: '30 minutes',
    locations: '1 location',
  },
  {
    name: 'Aerial Pro',
    slug: 'aerial-pro',
    price: 29900,
    duration: '90 minutes',
    locations: 'Up to 2 locations',
  },
  {
    name: 'Cinematic Full Day',
    slug: 'cinematic-full-day',
    price: 59900,
    duration: 'Full day',
    locations: 'Up to 5 locations',
  },
];

export function getPackageBySlug(slug) {
  return PACKAGES.find((p) => p.slug === slug) || null;
}
