export const SERVICES = [
  { name: 'Gutter Inspection', slug: 'gutter', basePrice: 2500, displayPrice: '25.00' },
  { name: 'Chimney Inspection', slug: 'chimney', basePrice: 2500, displayPrice: '25.00' },
  { name: 'Roof Inspection', slug: 'roof-inspection', basePrice: 3500, displayPrice: '35.00' },
  { name: 'Property Roof Inspection', slug: 'property-roof-inspection', basePrice: 4500, displayPrice: '45.00' },
  { name: 'Property Aerial Photos (Photos Only)', slug: 'aerial-photos', basePrice: 3500, displayPrice: '35.00' },
];

export function getServiceBySlug(slug) {
  return SERVICES.find((s) => s.slug === slug) || null;
}
