/**
 * Format order number for display and emails (plain number).
 */
export function formatOrderNumber(orderNumber) {
  if (orderNumber == null) return '';
  return String(orderNumber);
}
