import { formatOrderNumber } from '../utils/format.js';
import { env } from '../config/env.js';

const L = {
  bodyBg: '#F5F5F7',
  cardBg: '#ffffff',
  text: '#111827',
  textFaint: '#6b7280',
  border: '#e5e7eb',
  footer: '#6b7280',
  amountBoxBg: '#FBE9E7',
  font: "'Inter',Arial,sans-serif",
};

function logoUrl() {
  let base = (env.clientUrl || 'https://skyreachvisuals.co.uk').replace(/\/$/, '');
  if (base.startsWith('http://') && env.nodeEnv === 'production') base = base.replace('http://', 'https://');
  return `${base}/skyreach_visuals_text_logo.png`;
}

/**
 * Generate invoice HTML (light theme: white card on light grey, dark text, light pink amount box).
 * @param {{ orderNumber?: number|null, packageName?: string, packagePrice?: number, shootDate?: Date|string|null, location?: string|null }} booking
 * @param {{ name?: string|null, email?: string|null }} user
 * @param {{ pricePence?: number, customerName?: string, customerEmail?: string, serviceName?: string, location?: string, invoiceDate?: string, shootDate?: string }} [options] - Field overrides (e.g. admin invoice editor)
 */
export function generateInvoiceHtml(booking, user, options = {}) {
  const invoiceTopDate =
    options.invoiceDate != null && options.invoiceDate !== ''
      ? new Date(options.invoiceDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const shootSource =
    options.shootDate != null && options.shootDate !== '' ? options.shootDate : booking?.shootDate;
  const shootDate = shootSource
    ? new Date(shootSource).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const pricePence = options.pricePence != null ? options.pricePence : (booking?.packagePrice ?? 0);
  const amount = (pricePence / 100).toFixed(2);
  const orderNo = formatOrderNumber(booking?.orderNumber);
  const customerName = options.customerName ?? user?.name ?? '—';
  const customerEmail = options.customerEmail ?? user?.email ?? '—';
  const serviceName = options.serviceName ?? booking?.packageName ?? '—';
  const location = options.location ?? booking?.location ?? '—';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>Invoice — ${orderNo || '—'}</title></head>
<body style="margin:0;padding:0;background-color:${L.bodyBg};font-family:${L.font};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${L.bodyBg};padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${L.cardBg};border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);border:1px solid ${L.border};">
        <tr><td style="padding:24px 40px 16px;border-radius:12px 12px 0 0;background-color:${L.cardBg};"><img src="${logoUrl()}" alt="SkyReach Visuals" width="120" height="40" style="display:block;max-width:120px;height:auto;border-radius:4px;" /></td></tr>
        <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};"><h2 style="margin:0;color:${L.text};font-size:20px;font-weight:600;">Invoice</h2></td></tr>
        <tr><td style="padding:0 40px 8px;background-color:${L.cardBg};"><p style="margin:0;color:${L.textFaint};font-size:14px;">${invoiceTopDate} &middot; ${orderNo || '—'}</p></td></tr>
        <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};">
          <div style="background-color:${L.amountBoxBg};border-radius:8px;padding:16px 20px;margin:16px 0;text-align:center;"><span style="font-size:22px;font-weight:700;color:${L.text};">£${amount}</span></div>
        </td></tr>
        <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};">
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;font-family:${L.font};">
            <tr><td style="padding:8px 0;color:${L.textFaint};width:140px;">Customer</td><td style="padding:8px 0;color:${L.text};">${customerName}</td></tr>
            <tr><td style="padding:8px 0;color:${L.textFaint};">Email</td><td style="padding:8px 0;color:${L.text};">${customerEmail}</td></tr>
            <tr><td style="padding:8px 0;color:${L.textFaint};">Service</td><td style="padding:8px 0;color:${L.text};">${serviceName}</td></tr>
            <tr><td style="padding:8px 0;color:${L.textFaint};">Shoot date</td><td style="padding:8px 0;color:${L.text};">${shootDate}</td></tr>
            <tr><td style="padding:8px 0;color:${L.textFaint};">Location</td><td style="padding:8px 0;color:${L.text};">${location}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid ${L.border};border-radius:0 0 12px 12px;background-color:${L.cardBg};"><p style="margin:0 0 8px;font-size:12px;color:${L.footer};">SkyReach Visuals &middot; Bournemouth, Dorset, UK &middot; 07877 691861 &middot; ${env.emailFrom || 'support@skyreachvisuals.co.uk'}</p><p style="margin:12px 0 0;"><img src="${logoUrl()}" alt="SkyReach Visuals" width="96" height="32" style="display:inline-block;border-radius:4px;max-width:96px;" /></p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
