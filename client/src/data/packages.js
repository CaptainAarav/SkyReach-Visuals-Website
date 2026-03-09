export const SERVICES = [
  {
    name: 'Roof Inspection',
    slug: 'roof-inspection',
    basePrice: 3999,
    displayPrice: '39.99',
    description: 'Aerial roof check using drone. Identify damage, leaks, or missing tiles. Includes photos and short video.',
  },
  {
    name: 'Gutter Inspection',
    slug: 'gutter-inspection',
    basePrice: 2499,
    displayPrice: '24.99',
    description: 'Check gutters for blockages or damage. Safe inspection without ladders. Includes photos and video.',
  },
  {
    name: 'Chimney Inspection',
    slug: 'chimney-inspection',
    basePrice: 2999,
    displayPrice: '29.99',
    description: 'Inspect chimney for cracks or loose bricks. Ideal for maintenance checks. Includes photos and video.',
  },
  {
    name: 'Property Aerial Photos',
    slug: 'property-aerial-photos',
    basePrice: 4999,
    displayPrice: '49.99',
    description: 'Professional aerial photos of your property. Fully edited and colour graded. High-quality images delivered digitally.',
  },
];

export function getServiceBySlug(slug) {
  return SERVICES.find((s) => s.slug === slug) || null;
}

/** Quote-only services (no fixed price); used on Get a Quote page */
export const QUOTE_SERVICES = [
  {
    name: 'Business Promotional Video',
    slug: 'business-promotional-video',
    description: 'Cinematic drone footage for your business. Perfect for websites and social media. Professionally edited final video.',
  },
  {
    name: 'Event Drone Filming',
    slug: 'event-drone-filming',
    description: 'Aerial coverage of events and gatherings. Capture the atmosphere from above. Edited video available on request.',
  },
  {
    name: 'Luxury Property Video',
    slug: 'luxury-property-video',
    description: 'Cinematic drone showcase of high-end properties. Ideal for estate agents and property marketing. Smooth aerial shots with professional editing.',
  },
  {
    name: 'Construction Aerial Progress (Photos/Videos)',
    slug: 'construction-aerial-progress',
    description: 'Aerial updates of construction sites. Track progress over time. Photos and videos delivered digitally.',
  },
  {
    name: 'Custom Drone Project',
    slug: 'custom-drone-project',
    description: 'Tailored drone filming for unique projects. Flexible for commercial or creative work. Discuss your requirements and receive a quote.',
  },
];
