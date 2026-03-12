import { formatOrderNumber } from '../utils/format.js';
import { env } from '../config/env.js';

const L = {
  bodyBg: '#f4f4f5',
  cardBg: '#ffffff',
  cardShadow: '0 1px 3px rgba(0,0,0,0.08)',
  text: '#111827',
  textMuted: '#4b5563',
  textFaint: '#6b7280',
  border: '#e5e7eb',
  accentLight: 'rgba(196, 30, 58, 0.08)',
  link: '#2563eb',
  footer: '#6b7280',
  font: "'Inter',Arial,sans-serif",
};

function logoUrl() {
  let base = (env.clientUrl || 'https://skyreachvisuals.co.uk').replace(/\/$/, '');
  if (base.startsWith('http://') && env.nodeEnv === 'production') base = base.replace('http://', 'https://');
  return `${base}/skyreach_visuals_text_logo.png`;
}

/**
 * Generate invoice HTML (light, minimal style: white card, highlighted amount, clear footer).
 */
export function generateInvoiceHtml(booking, user) {
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const shootDate = booking.shootDate
    ? new Date(booking.shootDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';
  const amount = (booking.packagePrice / 100).toFixed(2);
  const orderNo = formatOrderNumber(booking.orderNumber);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>Invoice — ${orderNo || '—'}</title></head>
<body style="margin:0;padding:0;background-color:${L.bodyBg};font-family:${L.font};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${L.bodyBg};padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${L.cardBg};border-radius:12px;box-shadow:${L.cardShadow};border:1px solid ${L.border};">
        <tr><td style="padding:32px 40px 24px;"><img src="${logoUrl()}" alt="SkyReach Visuals" width="120" height="40" style="display:block;max-width:120px;height:auto;" /></td></tr>
        <tr><td style="padding:0 40px 8px;"><h2 style="margin:0;color:${L.text};font-size:22px;font-weight:600;">Invoice</h2></td></tr>
        <tr><td style="padding:0 40px 8px;"><p style="margin:0;color:${L.textFaint};font-size:14px;">${date} &middot; ${orderNo || '—'}</p></td></tr>
        <tr><td style="padding:0 40px 24px;">
          <div style="background-color:${L.accentLight};border-radius:8px;padding:16px 20px;margin:16px 0;text-align:center;"><span style="font-size:22px;font-weight:700;color:${L.text};">£${amount}</span></div>
        </td></tr>
        <tr><td style="padding:0 40px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            <tr><td style="padding:8px 0;color:${L.textFaint};width:140px;">Customer</td><td style="padding:8px 0;color:${L.text};">${user?.name ?? '—'}</td></tr>
            <tr><td style="padding:8px 0;color:${L.textFaint};">Email</td><td style="padding:8px 0;color:${L.text};">${user?.email ?? '—'}</td></tr>
            <tr><td style="padding:8px 0;color:${L.textFaint};">Service</td><td style="padding:8px 0;color:${L.text};">${booking.packageName}</td></tr>
            <tr><td style="padding:8px 0;color:${L.textFaint};">Shoot date</td><td style="padding:8px 0;color:${L.text};">${shootDate}</td></tr>
            <tr><td style="padding:8px 0;color:${L.textFaint};">Location</td><td style="padding:8px 0;color:${L.text};">${booking.location ?? '—'}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 40px 32px;border-top:1px solid ${L.border};"><p style="margin:0;font-size:12px;color:${L.footer};">SkyReach Visuals &middot; Bournemouth, Dorset, UK &middot; 07877 691861 &middot; ${env.emailFrom || 'support@skyreachvisuals.co.uk'}</p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
