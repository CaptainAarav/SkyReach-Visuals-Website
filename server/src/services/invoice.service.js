/**
 * Generate invoice HTML. When a template file is provided, it can be used to style the output.
 * For now generates a simple HTML invoice with customer details and booking info.
 */
export function generateInvoiceHtml(booking, user) {
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const shootDate = booking.shootDate
    ? new Date(booking.shootDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';
  const amount = (booking.packagePrice / 100).toFixed(2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice — Order ${booking.orderNumber ?? ''}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #1a1a2e; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    .meta { color: #666; font-size: 14px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    th, td { text-align: left; padding: 10px 0; border-bottom: 1px solid #eee; }
    th { color: #666; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    .total { font-size: 18px; font-weight: 700; margin-top: 16px; }
    .footer { margin-top: 40px; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <h1>Invoice</h1>
  <p class="meta">SkyReach Visuals · Bournemouth, Dorset, UK</p>
  <p class="meta">Date: ${date}</p>

  <table>
    <tr><th>Order number</th><td>${booking.orderNumber ?? '—'}</td></tr>
    <tr><th>Customer</th><td>${user?.name ?? '—'}</td></tr>
    <tr><th>Email</th><td>${user?.email ?? '—'}</td></tr>
    <tr><th>Service</th><td>${booking.packageName}</td></tr>
    <tr><th>Shoot date</th><td>${shootDate}</td></tr>
    <tr><th>Location</th><td>${booking.location ?? '—'}</td></tr>
    <tr><th>Amount paid</th><td class="total">£${amount}</td></tr>
  </table>

  <p class="footer">Thank you for your business. For queries contact support@skyreachvisuals.co.uk or 07877 691861.</p>
</body>
</html>`;
}
