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
