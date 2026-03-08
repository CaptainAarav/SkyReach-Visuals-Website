export const PACKAGES = [
  {
    name: 'Horizon',
    slug: 'horizon',
    price: 14900,
    displayPrice: '149',
    duration: '30 minutes',
    locations: '1 location',
    features: [
      'Up to 30 minutes of flight time',
      '3 professionally edited video clips',
      'Single location shoot',
      'Delivered within 5 working days',
    ],
  },
  {
    name: 'Aerial Pro',
    slug: 'aerial-pro',
    price: 29900,
    displayPrice: '299',
    duration: '90 minutes',
    locations: 'Up to 2 locations',
    highlighted: true,
    features: [
      'Up to 90 minutes of flight time',
      '8 professionally edited video clips',
      'Up to 2 locations',
      'Professional colour grading',
      'Delivered within 3 working days',
    ],
  },
  {
    name: 'Cinematic Full Day',
    slug: 'cinematic-full-day',
    price: 59900,
    displayPrice: '599',
    duration: 'Full day',
    locations: 'Up to 5 locations',
    features: [
      'Full day of filming',
      'Unlimited edited clips',
      'Up to 5 locations',
      'Full post-production suite',
      'Licensed music included',
      'Delivered within 7 working days',
    ],
  },
];

export function getPackageBySlug(slug) {
  return PACKAGES.find((p) => p.slug === slug) || null;
}
