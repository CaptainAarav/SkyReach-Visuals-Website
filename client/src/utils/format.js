/**
 * Format order number for display (e.g. "5266").
 * Optionally use a prefix like "SR-" by changing the return value.
 */
export function formatOrderNumber(orderNumber) {
  if (orderNumber == null) return '';
  return String(orderNumber);
}
