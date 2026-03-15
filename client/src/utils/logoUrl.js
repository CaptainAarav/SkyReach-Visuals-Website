/**
 * Full URL for the SkyReach text logo (used in email previews and anywhere the logo must load from a reliable absolute path).
 * In the browser this uses the current origin so the logo loads regardless of base path or routing.
 */
export function getLogoUrl() {
  if (typeof window === 'undefined') return '/skyreach_visuals_text_logo.png';
  const base = window.location.origin.replace(/\/$/, '');
  return `${base}/skyreach_visuals_text_logo.png`;
}
