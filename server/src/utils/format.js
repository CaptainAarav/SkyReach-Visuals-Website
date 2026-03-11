/**
 * Format order number for display and emails (e.g. "CR5266").
 */
export function formatOrderNumber(orderNumber) {
  if (orderNumber == null) return '';
  return `CR${orderNumber}`;
}
