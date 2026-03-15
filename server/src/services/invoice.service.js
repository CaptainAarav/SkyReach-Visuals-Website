import { formatOrderNumber } from '../utils/format.js';
import { env } from '../config/env.js';

const DARK = {
  bodyBg: '#0f0f0f',
  cardBg: '#1E2D4A',
  text: '#F5F3EE',
  textFaint: 'rgba(245,243,238,0.5)',
  border: 'rgba(255,255,255,0.12)',
  footer: 'rgba(245,243,238,0.4)',
  font: "'Inter',Arial,sans-serif",
};

function logoUrl() {
  let base = (env.clientUrl || 'https://skyreachvisuals.co.uk').replace(/\/$/, '');
  if (base.startsWith('http://') && env.nodeEnv === 'production') base = base.replace('http://', 'https://');
  return `${base}/skyreach_visuals_text_logo.png`;
}

/**
 * Generate invoice HTML (dark style: navy card, light text, matches admin email design).
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
<body style="margin:0;padding:0;background-color:${DARK.bodyBg};font-family:${DARK.font};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${DARK.bodyBg};padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${DARK.cardBg};border-radius:12px;border:1px solid rgba(196,30,58,0.25);">
        <tr><td style="padding:24px 40px 16px;border-radius:12px 12px 0 0;"><img src="${logoUrl()}" alt="SkyReach Visuals" width="120" height="40" style="display:block;max-width:120px;height:auto;border-radius:4px;filter:brightness(0) invert(1);opacity:0.95;" /></td></tr>
        <tr><td style="padding:0 40px 24px;"><h2 style="margin:0;color:${DARK.text};font-size:20px;font-weight:600;">Invoice</h2></td></tr>
        <tr><td style="padding:0 40px 8px;"><p style="margin:0;color:${DARK.textFaint};font-size:14px;">${date} &middot; ${orderNo || '—'}</p></td></tr>
        <tr><td style="padding:0 40px 24px;">
          <div style="background-color:rgba(255,255,255,0.08);border-radius:8px;padding:16px 20px;margin:16px 0;text-align:center;"><span style="font-size:22px;font-weight:700;color:${DARK.text};">£${amount}</span></div>
        </td></tr>
        <tr><td style="padding:0 40px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;font-family:${DARK.font};">
            <tr><td style="padding:8px 0;color:${DARK.textFaint};width:140px;">Customer</td><td style="padding:8px 0;color:${DARK.text};">${user?.name ?? '—'}</td></tr>
            <tr><td style="padding:8px 0;color:${DARK.textFaint};">Email</td><td style="padding:8px 0;color:${DARK.text};">${user?.email ?? '—'}</td></tr>
            <tr><td style="padding:8px 0;color:${DARK.textFaint};">Service</td><td style="padding:8px 0;color:${DARK.text};">${booking.packageName}</td></tr>
            <tr><td style="padding:8px 0;color:${DARK.textFaint};">Shoot date</td><td style="padding:8px 0;color:${DARK.text};">${shootDate}</td></tr>
            <tr><td style="padding:8px 0;color:${DARK.textFaint};">Location</td><td style="padding:8px 0;color:${DARK.text};">${booking.location ?? '—'}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid ${DARK.border};border-radius:0 0 12px 12px;"><p style="margin:0 0 8px;font-size:12px;color:${DARK.footer};">SkyReach Visuals &middot; Bournemouth, Dorset, UK &middot; 07877 691861 &middot; ${env.emailFrom || 'support@skyreachvisuals.co.uk'}</p><p style="margin:12px 0 0;"><img src="${logoUrl()}" alt="SkyReach Visuals" width="96" height="32" style="display:inline-block;border-radius:4px;filter:brightness(0) invert(1);opacity:0.9;max-width:96px;" /></p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
