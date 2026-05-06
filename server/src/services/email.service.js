import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { formatOrderNumber } from '../utils/format.js';
import { generateInvoiceHtml } from './invoice.service.js';
import { appendToSent } from './imap.service.js';

let transporter = null;

function getTransporter() {
  if (!transporter && env.smtp.host && env.smtp.user && env.smtp.pass) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
      tls: { rejectUnauthorized: true },
    });
  }
  return transporter;
}

function mailHeaders() {
  return {
    'X-Mailer': 'SkyReachVisuals/1.0',
    'Precedence': 'auto',
    'List-Unsubscribe': `<mailto:${env.emailFrom}?subject=unsubscribe>`,
  };
}

function logoUrl() {
  let base = (env.clientUrl || 'https://skyreachvisuals.co.uk').replace(/\/$/, '');
  if (base.startsWith('http://') && env.nodeEnv === 'production') base = base.replace('http://', 'https://');
  return `${base}/skyreach_visuals_text_logo.png`;
}

const EMAIL_RADIUS = '12px';
const EMAIL_LOGO_RADIUS = '4px';

const EMAIL_DARK = {
  bodyBg: '#1a1a2e',
  cardBg: '#1E2D4A',
  text: '#F5F3EE',
  textMuted: 'rgba(245,243,238,0.7)',
  textFaint: 'rgba(245,243,238,0.5)',
  border: 'rgba(255,255,255,0.12)',
  footer: 'rgba(245,243,238,0.4)',
  link: '#e8a4b0',
  buttonBg: '#C41E3A',
  buttonText: '#ffffff',
};

/** Light theme: white card on light grey, dark text, no blue/dark (matches provided design). */
const L = {
  bodyBg: '#F5F5F7',
  cardBg: '#ffffff',
  cardShadow: '0 1px 3px rgba(0,0,0,0.08)',
  text: '#111827',
  textMuted: '#4b5563',
  textFaint: '#6b7280',
  border: '#e5e7eb',
  accent: '#C41E3A',
  amountBoxBg: '#FBE9E7',
  link: '#C41E3A',
  buttonBg: '#C41E3A',
  buttonText: '#ffffff',
  footer: '#6b7280',
  font: "'Inter',Arial,sans-serif",
};

/** White-themed logo row at top of card (all emails). */
function darkLogoHeader() {
  return `<tr>
  <td style="background-color:${EMAIL_DARK.cardBg};padding:24px 40px 16px;text-align:left;border-radius:${EMAIL_RADIUS} ${EMAIL_RADIUS} 0 0;">
    <img src="${logoUrl()}" alt="SkyReach Visuals" width="120" height="40" style="display:block;max-width:120px;height:auto;border-radius:${EMAIL_LOGO_RADIUS};filter:brightness(0) invert(1);opacity:0.95;" />
  </td>
</tr>`;
}

function emailHeader(title) {
  if (!title) return '';
  return `<tr>
  <td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 24px;text-align:left;">
    <h1 style="margin:0;color:${EMAIL_DARK.text};font-size:20px;font-weight:600;font-family:'Inter',Arial,sans-serif;">${title}</h1>
  </td>
</tr>`;
}

function emailFooter() {
  return lightSignature('SkyReach Visuals');
}

/** Dark layout: outer #0f0f0f, card #1E2D4A, light text (matches admin compose preview). */
function darkWrapper(innerRows) {
  const cardBorder = 'rgba(196, 30, 58, 0.25)';
  return `
<body style="margin:0;padding:0;background-color:#0f0f0f;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${EMAIL_DARK.cardBg};border-radius:${EMAIL_RADIUS};border:1px solid ${cardBorder};">
          ${innerRows}
        </table>
      </td>
    </tr>
  </table>
</body>`;
}

function darkSignature(senderName) {
  const fromAddr = env.emailFrom || 'support@skyreachvisuals.co.uk';
  return `<tr>
  <td style="background-color:${EMAIL_DARK.cardBg};padding:24px 40px;text-align:left;border-radius:0 0 ${EMAIL_RADIUS} ${EMAIL_RADIUS};border-top:1px solid ${EMAIL_DARK.border};">
    <p style="margin:0 0 8px;color:${EMAIL_DARK.text};font-size:13px;font-family:'Inter',Arial,sans-serif;"><strong>SkyReach Visuals</strong><br/>${senderName} — Drone Aerial Photography &amp; Inspection &middot; 07877 691861 &middot; ${fromAddr}</p>
    <p style="margin:12px 0 0;"><img src="${logoUrl()}" alt="SkyReach Visuals" width="96" height="32" style="display:inline-block;border-radius:${EMAIL_LOGO_RADIUS};filter:brightness(0) invert(1);opacity:0.9;max-width:96px;" /></p>
  </td>
</tr>`;
}

function darkCtaButton(href, label) {
  return `<p style="margin:24px 0 0;">
    <a href="${href}" style="display:inline-block;background-color:${EMAIL_DARK.buttonBg};color:${EMAIL_DARK.buttonText};text-decoration:none;font-size:16px;font-weight:600;padding:14px 28px;border-radius:8px;font-family:'Inter',Arial,sans-serif;">${label}</a>
  </p>`;
}

function darkHighlight(htmlContent) {
  return `<div style="background-color:rgba(255,255,255,0.08);border-radius:8px;padding:16px 20px;margin:20px 0;text-align:center;">
    <span style="font-size:22px;font-weight:700;color:${EMAIL_DARK.text};font-family:'Inter',Arial,sans-serif;">${htmlContent}</span>
  </div>`;
}

/** Light layout: outer light grey, centered white card with shadow (no blue/dark). */
function lightWrapper(innerRows) {
  return `
<body style="margin:0;padding:0;background-color:${L.bodyBg};font-family:${L.font};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${L.bodyBg};padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${L.cardBg};border-radius:${EMAIL_RADIUS};box-shadow:${L.cardShadow};border:1px solid ${L.border};">
          ${innerRows}
        </table>
      </td>
    </tr>
  </table>
</body>`;
}

/** Logo at top of white card (light theme — normal logo, no invert). */
function lightLogoHeader() {
  return `<tr>
  <td style="padding:24px 40px 16px;text-align:left;border-radius:${EMAIL_RADIUS} ${EMAIL_RADIUS} 0 0;background-color:${L.cardBg};">
    <img src="${logoUrl()}" alt="SkyReach Visuals" width="120" height="40" style="display:block;max-width:120px;height:auto;border-radius:${EMAIL_LOGO_RADIUS};" />
  </td>
</tr>`;
}

/** Title below logo (light theme). */
function lightEmailHeader(title) {
  if (!title) return '';
  return `<tr>
  <td style="padding:0 40px 24px;text-align:left;background-color:${L.cardBg};">
    <h1 style="margin:0;color:${L.text};font-size:20px;font-weight:600;font-family:${L.font};">${title}</h1>
  </td>
</tr>`;
}

/** Light pink/peach amount box (as in design). */
function lightAmountBox(htmlContent) {
  return `<div style="background-color:${L.amountBoxBg};border-radius:8px;padding:16px 20px;margin:20px 0;text-align:center;">
    <span style="font-size:22px;font-weight:700;color:${L.text};font-family:${L.font};">${htmlContent}</span>
  </div>`;
}

/** Highlight box for other key info (light theme). */
function lightHighlight(htmlContent) {
  return `<div style="background-color:${L.amountBoxBg};border-radius:8px;padding:16px 20px;margin:20px 0;text-align:center;">
    <span style="font-size:22px;font-weight:700;color:${L.text};font-family:${L.font};">${htmlContent}</span>
  </div>`;
}

/** Footer/signature for light theme (dark text, normal logo). */
function lightSignature(senderName) {
  const fromAddr = env.emailFrom || 'support@skyreachvisuals.co.uk';
  return `<tr>
  <td style="padding:24px 40px;text-align:left;border-radius:0 0 ${EMAIL_RADIUS} ${EMAIL_RADIUS};border-top:1px solid ${L.border};background-color:${L.cardBg};">
    <p style="margin:0 0 8px;color:${L.text};font-size:13px;font-family:${L.font};"><strong>SkyReach Visuals</strong><br/>${senderName} — Drone Aerial Photography &amp; Inspection &middot; 07877 691861 &middot; ${fromAddr}</p>
    <p style="margin:12px 0 0;"><img src="${logoUrl()}" alt="SkyReach Visuals" width="96" height="32" style="display:inline-block;border-radius:${EMAIL_LOGO_RADIUS};max-width:96px;" /></p>
  </td>
</tr>`;
}

/** Primary CTA button. */
function lightCtaButton(href, label) {
  return `<p style="margin:28px 0 24px;">
    <a href="${href}" style="display:inline-block;background-color:${L.buttonBg};color:${L.buttonText};text-decoration:none;font-size:16px;font-weight:600;padding:14px 28px;border-radius:8px;font-family:${L.font};">${label}</a>
  </p>`;
}

/** Footer: support link + address (light theme). */
function lightFooter() {
  const supportUrl = (env.clientUrl || 'https://skyreachvisuals.co.uk').replace(/\/$/, '') + '/#contact';
  return `<tr>
  <td style="padding:24px 40px 32px;border-radius:0 0 ${EMAIL_RADIUS} ${EMAIL_RADIUS};border-top:1px solid ${L.border};">
    <p style="margin:0 0 6px;font-size:12px;color:${L.footer};font-family:${L.font};">
      <a href="${supportUrl}" style="color:${L.link};text-decoration:none;">Support</a> &middot; SkyReach Visuals &middot; Bournemouth, Dorset, UK
    </p>
    <p style="margin:0;font-size:12px;color:${L.footer};font-family:${L.font};">07877 691861 &middot; ${env.emailFrom || 'support@skyreachvisuals.co.uk'}</p>
  </td>
</tr>`;
}

export async function sendBookingConfirmation({ to, booking }) {
  const transport = getTransporter();
  if (!transport) {
    console.log('SMTP not configured — skipping booking confirmation email');
    console.log('Would send to:', to, 'Booking:', booking.id);
    return;
  }

  const shootDate = new Date(booking.shootDate).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const orderNo = formatOrderNumber(booking.orderNumber);
  const amount = `£${(booking.packagePrice / 100).toFixed(2)}`;
  const inner = `
  ${lightLogoHeader()}
  ${lightEmailHeader('Booking confirmed')}
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};"><p style="margin:0;color:${L.textMuted};font-size:15px;line-height:1.6;">Thanks for booking with us. Here are your details:</p></td></tr>
  <tr><td style="padding:0 40px;background-color:${L.cardBg};">${lightHighlight(`Order ${orderNo} &middot; ${amount}`)}</td></tr>
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-family:${L.font};">
      <tr><td style="padding:8px 0;color:${L.textFaint};font-size:13px;">Service</td><td style="padding:8px 0;color:${L.text};font-size:15px;font-weight:600;">${booking.packageName}</td></tr>
      <tr><td style="padding:8px 0;color:${L.textFaint};font-size:13px;">Date</td><td style="padding:8px 0;color:${L.text};font-size:15px;">${shootDate}</td></tr>
      ${booking.shootTime ? `<tr><td style="padding:8px 0;color:${L.textFaint};font-size:13px;">Time</td><td style="padding:8px 0;color:${L.text};font-size:15px;">${booking.shootTime}</td></tr>` : ''}
      <tr><td style="padding:8px 0;color:${L.textFaint};font-size:13px;">Location</td><td style="padding:8px 0;color:${L.text};font-size:15px;">${booking.location || '—'}</td></tr>
    </table>
    <p style="margin:24px 0 0;color:${L.textMuted};font-size:14px;line-height:1.6;">We'll be in touch within 24 hours to confirm the final details. If you have any questions, reply to this email or call us on 07877 691861.</p>
  </td></tr>
  ${lightSignature('SkyReach Visuals')}`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>${lightWrapper(inner)}</html>`;

  await transport.sendMail({
    from: `"SkyReach Visuals" <${env.emailFrom}>`,
    to,
    subject: `Booking Confirmed — ${booking.packageName} | SkyReach Visuals`,
    headers: mailHeaders(),
    html,
  });
}

export async function sendInvoiceEmail({ booking, user }) {
  const transport = getTransporter();
  if (!transport) {
    console.log('SMTP not configured — skipping invoice email');
    return;
  }
  const to = user?.email;
  if (!to) return;
  const html = generateInvoiceHtml(booking, user);
  const orderNo = formatOrderNumber(booking.orderNumber);
  await transport.sendMail({
    from: `"SkyReach Visuals" <${env.emailFrom}>`,
    to,
    subject: `Your invoice — Order ${orderNo} | SkyReach Visuals`,
    headers: mailHeaders(),
    html,
  });
}

export async function sendPaymentRequestAccepted({ to, payUrl, customerName }) {
  const transport = getTransporter();
  if (!transport) {
    console.log('SMTP not configured — skipping payment request accepted email');
    return;
  }
  const name = customerName || 'there';
  const inner = `
  ${lightLogoHeader()}
  ${lightEmailHeader('Payment link ready')}
  <tr><td style="padding:40px;text-align:left;background-color:${L.cardBg};">
    <p style="margin:0 0 24px;color:${L.text};font-size:15px;line-height:1.6;">Hi ${name}, your payment request has been accepted. Use the link below to complete your payment securely.</p>
    <div style="margin:0 0 24px;">${lightCtaButton(payUrl, 'Pay Now')}</div>
    <p style="margin:0;color:${L.textMuted};font-size:14px;line-height:1.6;">If you have any questions, reply to this email or call us on 07877 691861.</p>
  </td></tr>
  ${lightSignature('SkyReach Visuals')}`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>${lightWrapper(inner)}</html>`;
  await transport.sendMail({
    from: `"SkyReach Visuals" <${env.emailFrom}>`,
    to,
    subject: 'Your payment link is ready | SkyReach Visuals',
    headers: mailHeaders(),
    html,
  });
}

export async function sendPaymentRequestDeclined({ to, customerName }) {
  const transport = getTransporter();
  if (!transport) {
    console.log('SMTP not configured — skipping payment request declined email');
    return;
  }
  const name = customerName || 'there';
  const inner = `
  ${lightLogoHeader()}
  ${lightEmailHeader('Payment request update')}
  <tr><td style="padding:40px;text-align:left;background-color:${L.cardBg};">
    <p style="margin:0 0 24px;color:${L.text};font-size:15px;line-height:1.6;">Hi ${name}, we're unable to proceed with your payment request at this time.</p>
    <p style="margin:0;color:${L.textMuted};font-size:14px;line-height:1.6;">If you have questions, reply to this email or call us on 07877 691861.</p>
  </td></tr>
  ${lightSignature('SkyReach Visuals')}`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>${lightWrapper(inner)}</html>`;
  await transport.sendMail({
    from: `"SkyReach Visuals" <${env.emailFrom}>`,
    to,
    subject: 'Payment request update | SkyReach Visuals',
    headers: mailHeaders(),
    html,
  });
}

export async function sendPaymentRequestAdjusted({ to, customerName, adminNotes, adjustedAmount }) {
  const transport = getTransporter();
  if (!transport) {
    console.log('SMTP not configured — skipping payment request adjusted email');
    return;
  }
  const name = customerName || 'there';
  const amountLine = adjustedAmount != null ? `<p style="margin:0 0 8px;color:${L.text};font-size:14px;"><strong>Revised amount:</strong> &pound;${(adjustedAmount / 100).toFixed(2)}</p>` : '';
  const notesLine = adminNotes ? `<p style="margin:0 0 16px;color:${L.text};font-size:14px;line-height:1.6;">${adminNotes}</p>` : '';
  const inner = `
  ${lightLogoHeader()}
  ${lightEmailHeader('Payment request update')}
  <tr><td style="padding:40px;text-align:left;background-color:${L.cardBg};">
    <p style="margin:0 0 24px;color:${L.text};font-size:15px;line-height:1.6;">Hi ${name}, your payment request has been updated with the details below.</p>
    ${amountLine}
    ${notesLine}
    <p style="margin:0;color:${L.textMuted};font-size:14px;line-height:1.6;">We'll be in touch with a payment link if applicable, or reply to this email / call 07877 691861 with any questions.</p>
  </td></tr>
  ${lightSignature('SkyReach Visuals')}`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>${lightWrapper(inner)}</html>`;
  await transport.sendMail({
    from: `"SkyReach Visuals" <${env.emailFrom}>`,
    to,
    subject: 'Payment request update | SkyReach Visuals',
    headers: mailHeaders(),
    html,
  });
}

export async function sendContactNotification({ name, email, phone, location, serviceType, extraDetails, message }) {
  const transport = getTransporter();
  if (!transport) {
    console.log('SMTP not configured — skipping contact notification');
    console.log('Contact from:', name, email, message);
    return;
  }

  const locationLine = location ? `<tr><td style="padding:6px 0;color:${L.textFaint};font-size:13px;">Location</td><td style="padding:6px 0;color:${L.text};font-size:14px;">${location}</td></tr>` : '';
  const serviceTypeLine = serviceType ? `<tr><td style="padding:6px 0;color:${L.textFaint};font-size:13px;">Service type</td><td style="padding:6px 0;color:${L.text};font-size:14px;">${serviceType}</td></tr>` : '';
  const extraDetailsLine = extraDetails ? `<tr><td colspan="2" style="padding:12px 0 6px;color:${L.text};font-size:14px;line-height:1.6;white-space:pre-wrap;">${extraDetails}</td></tr>` : '';
  const inner = `
  ${lightLogoHeader()}
  ${lightEmailHeader('New enquiry')}
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-family:${L.font};font-size:14px;">
      <tr><td style="padding:6px 0;color:${L.textFaint};width:100px;">Name</td><td style="padding:6px 0;color:${L.text};">${name}</td></tr>
      <tr><td style="padding:6px 0;color:${L.textFaint};">Email</td><td style="padding:6px 0;color:${L.text};"><a href="mailto:${email}" style="color:${L.link};">${email}</a></td></tr>
      ${phone ? `<tr><td style="padding:6px 0;color:${L.textFaint};">Phone</td><td style="padding:6px 0;color:${L.text};">${phone}</td></tr>` : ''}
      ${locationLine}
      ${serviceTypeLine}
      ${extraDetailsLine}
    </table>
    <p style="margin:20px 0 0;padding-top:16px;border-top:1px solid ${L.border};color:${L.text};font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</p>
  </td></tr>
  ${lightSignature('SkyReach Visuals')}`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>${lightWrapper(inner)}</html>`;

  await transport.sendMail({
    from: `"SkyReach Visuals" <${env.emailFrom}>`,
    to: 'support@skyreachvisuals.co.uk',
    replyTo: email,
    subject: `New enquiry from ${name} | SkyReach Visuals`,
    headers: mailHeaders(),
    html,
  });
}

export async function sendVerificationEmail({ to, name, verifyUrl }) {
  const transport = getTransporter();
  if (!transport) {
    console.warn('SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS for verification emails.');
    const err = new Error('SMTP not configured');
    err.code = 'SMTP_NOT_CONFIGURED';
    throw err;
  }

  const inner = `
  ${lightLogoHeader()}
  ${lightEmailHeader('Verify your email')}
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};"><p style="margin:0;color:${L.textMuted};font-size:15px;line-height:1.6;">Hi ${name}, thanks for signing up. Click the button below to verify your email address.</p></td></tr>
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};">${lightCtaButton(verifyUrl, 'Verify my email')}</td></tr>
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};"><p style="margin:0;color:${L.textFaint};font-size:13px;line-height:1.6;">If the button doesn't work, copy this link: <a href="${verifyUrl}" style="color:${L.link};word-break:break-all;">${verifyUrl}</a></p></td></tr>
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};"><p style="margin:0;color:${L.textFaint};font-size:12px;">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p></td></tr>
  ${lightSignature('SkyReach Visuals')}`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>${lightWrapper(inner)}</html>`;

  try {
    await transport.sendMail({
      from: `"SkyReach Visuals" <${env.emailFrom}>`,
      to,
      subject: 'Verify your email | SkyReach Visuals',
      headers: mailHeaders(),
      html,
    });
    console.log('Verification email sent to', to);
  } catch (err) {
    console.error('Failed to send verification email to', to, err.message);
    throw err;
  }
}

export async function sendBookingApproved({ to, booking, payUrl }) {
  const transport = getTransporter();
  if (!transport) {
    console.log('SMTP not configured — skipping booking approved email');
    console.log('Would send to:', to, 'Booking:', booking.id);
    return;
  }

  const shootDate = new Date(booking.shootDate).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const orderNo = formatOrderNumber(booking.orderNumber);
  const amount = `£${(booking.packagePrice / 100).toFixed(2)}`;

  const inner = `
  ${lightLogoHeader()}
  ${lightEmailHeader('Booking approved')}
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};"><p style="margin:0;color:${L.textMuted};font-size:15px;line-height:1.6;">Great news! Your booking request has been approved. Complete your payment below.</p></td></tr>
  <tr><td style="padding:0 40px;background-color:${L.cardBg};">${lightAmountBox(`Amount to pay: ${amount}`)}</td></tr>
  <tr><td style="padding:0 40px 16px;text-align:center;background-color:${L.cardBg};"><p style="margin:0;color:${L.textFaint};font-size:13px;">Order ${orderNo}</p></td></tr>
  <tr><td style="padding:0 40px 8px;background-color:${L.cardBg};">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-family:${L.font};font-size:14px;">
      <tr><td style="padding:6px 0;color:${L.textFaint};">Service</td><td style="padding:6px 0;color:${L.text};">${booking.packageName}</td></tr>
      <tr><td style="padding:6px 0;color:${L.textFaint};">Date</td><td style="padding:6px 0;color:${L.text};">${shootDate}</td></tr>
      ${booking.shootTime ? `<tr><td style="padding:6px 0;color:${L.textFaint};">Time</td><td style="padding:6px 0;color:${L.text};">${booking.shootTime}</td></tr>` : ''}
      ${booking.location ? `<tr><td style="padding:6px 0;color:${L.textFaint};">Location</td><td style="padding:6px 0;color:${L.text};">${booking.location}</td></tr>` : ''}
    </table>
  </td></tr>
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};">${lightCtaButton(payUrl, 'Pay now')}</td></tr>
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};"><p style="margin:0;color:${L.textMuted};font-size:14px;line-height:1.6;">Click the button above to pay securely via Stripe. Questions? Reply to this email or call 07877 691861.</p></td></tr>
  ${lightSignature('SkyReach Visuals')}`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>${lightWrapper(inner)}</html>`;

  await transport.sendMail({
    from: `"SkyReach Visuals" <${env.emailFrom}>`,
    to,
    subject: `Booking Approved — ${booking.packageName} | SkyReach Visuals`,
    headers: mailHeaders(),
    html,
  });
}

export async function sendDirectInvoiceEmail({
  to,
  cc = [],
  booking,
  paymentMethod,
  checkoutUrl,
  pdfBuffer,
}) {
  const transport = getTransporter();
  if (!transport) {
    throw new AppError('SMTP not configured', 503);
  }

  const esc = (t) =>
    String(t)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const shootDate = booking.shootDate
    ? new Date(booking.shootDate).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';
  const orderNo = formatOrderNumber(booking.orderNumber);
  const amount = `£${(booking.packagePrice / 100).toFixed(2)}`;

  const detailTable = `<tr><td style="padding:0 40px 8px;background-color:${L.cardBg};">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-family:${L.font};font-size:14px;">
      <tr><td style="padding:6px 0;color:${L.textFaint};">Service</td><td style="padding:6px 0;color:${L.text};">${esc(booking.packageName)}</td></tr>
      <tr><td style="padding:6px 0;color:${L.textFaint};">Date</td><td style="padding:6px 0;color:${L.text};">${esc(shootDate)}</td></tr>
      ${booking.shootTime ? `<tr><td style="padding:6px 0;color:${L.textFaint};">Time</td><td style="padding:6px 0;color:${L.text};">${esc(booking.shootTime)}</td></tr>` : ''}
      ${booking.location ? `<tr><td style="padding:6px 0;color:${L.textFaint};">Location</td><td style="padding:6px 0;color:${L.text};">${esc(booking.location)}</td></tr>` : ''}
    </table>
  </td></tr>`;

  const attachmentNote = `<tr><td style="padding:0 40px 8px;background-color:${L.cardBg};"><p style="margin:0;color:${L.textMuted};font-size:14px;line-height:1.6;">Your invoice is attached as a PDF for your records.</p></td></tr>`;

  let paymentRows = '';
  if (paymentMethod === 'stripe') {
    paymentRows = `
  ${lightLogoHeader()}
  ${lightEmailHeader('Invoice & payment')}
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};"><p style="margin:0;color:${L.textMuted};font-size:15px;line-height:1.6;">Here is your invoice. Complete payment securely using the button below.</p></td></tr>
  <tr><td style="padding:0 40px;background-color:${L.cardBg};">${lightAmountBox(`Amount to pay: ${esc(amount)}`)}</td></tr>
  <tr><td style="padding:0 40px 16px;text-align:center;background-color:${L.cardBg};"><p style="margin:0;color:${L.textFaint};font-size:13px;">Order ${esc(orderNo)}</p></td></tr>
  ${detailTable}
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};">${lightCtaButton(checkoutUrl, 'Pay now')}</td></tr>
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};"><p style="margin:0;color:${L.textMuted};font-size:14px;line-height:1.6;">Click the button above to pay securely via Stripe. Questions? Reply to this email or call 07877 691861.</p></td></tr>
  ${attachmentNote}
  ${lightSignature('SkyReach Visuals')}`;
  } else {
    const b = env.bank;
    paymentRows = `
  ${lightLogoHeader()}
  ${lightEmailHeader('Invoice & payment details')}
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};"><p style="margin:0;color:${L.textMuted};font-size:15px;line-height:1.6;">Here is your invoice. Please send the requested amount using the bank details below.</p></td></tr>
  <tr><td style="padding:0 40px;background-color:${L.cardBg};">${lightAmountBox(`Amount to pay: ${esc(amount)}`)}</td></tr>
  <tr><td style="padding:0 40px 16px;text-align:center;background-color:${L.cardBg};"><p style="margin:0;color:${L.textFaint};font-size:13px;">Order ${esc(orderNo)}</p></td></tr>
  ${detailTable}
  <tr><td style="padding:0 40px 16px;background-color:${L.cardBg};"><p style="margin:0;color:${L.textMuted};font-size:15px;line-height:1.6;">Please send the requested amount to the following bank details:</p></td></tr>
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-family:${L.font};font-size:14px;">
      <tr><td style="padding:6px 0;color:${L.textFaint};width:120px;">Account name</td><td style="padding:6px 0;color:${L.text};">${esc(b.accountName)}</td></tr>
      <tr><td style="padding:6px 0;color:${L.textFaint};">Sort code</td><td style="padding:6px 0;color:${L.text};">${esc(b.sortCode)}</td></tr>
      <tr><td style="padding:6px 0;color:${L.textFaint};">Account number</td><td style="padding:6px 0;color:${L.text};">${esc(b.accountNumber)}</td></tr>
      ${b.referenceHint ? `<tr><td style="padding:6px 0;color:${L.textFaint};">Reference</td><td style="padding:6px 0;color:${L.text};">${esc(b.referenceHint)}</td></tr>` : ''}
    </table>
  </td></tr>
  ${attachmentNote}
  ${lightSignature('SkyReach Visuals')}`;
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>${lightWrapper(paymentRows)}</html>`;
  const filename = `invoice-${(orderNo || booking.id || 'order').replace(/[^a-zA-Z0-9-_]/g, '')}.pdf`;

  const mailOpts = {
    from: `"SkyReach Visuals" <${env.emailFrom}>`,
    to,
    subject: `Your invoice — Order ${orderNo} | SkyReach Visuals`,
    headers: mailHeaders(),
    html,
    attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }],
  };
  if (cc.length > 0) {
    mailOpts.cc = cc;
  }

  await transport.sendMail(mailOpts);
}

export async function sendBookingDeclined({ to, booking }) {
  const transport = getTransporter();
  if (!transport) {
    console.log('SMTP not configured — skipping booking declined email');
    console.log('Would send to:', to, 'Booking:', booking.id);
    return;
  }

  const inner = `
  ${lightLogoHeader()}
  ${lightEmailHeader('Booking update')}
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};"><p style="margin:0;color:${L.textMuted};font-size:15px;line-height:1.6;">We're sorry, but we're unable to approve your request for <strong style="color:${L.text};">${booking.packageName}</strong> at this time.</p></td></tr>
  ${booking.adminNotes ? `<tr><td style="padding:0 40px 16px;background-color:${L.cardBg};"><p style="margin:0;color:${L.text};font-size:14px;line-height:1.6;"><strong>Note:</strong> ${booking.adminNotes}</p></td></tr>` : ''}
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};"><p style="margin:0;color:${L.textMuted};font-size:14px;line-height:1.6;">If you'd like to discuss alternatives, reply to this email or call us on 07877 691861.</p></td></tr>
  ${lightSignature('SkyReach Visuals')}`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>${lightWrapper(inner)}</html>`;

  await transport.sendMail({
    from: `"SkyReach Visuals" <${env.emailFrom}>`,
    to,
    subject: `Booking Update — ${booking.packageName} | SkyReach Visuals`,
    headers: mailHeaders(),
    html,
  });
}

/** Build plain-text signature (for multipart email). */
function adminSignatureText(senderName) {
  const fromAddr = env.emailFrom || 'support@skyreachvisuals.co.uk';
  return [
    '',
    '--',
    'SkyReach Visuals',
    `${senderName} — Drone Aerial Photography & Inspection`,
    '+44 7877691861',
    fromAddr,
  ].join('\r\n');
}

/** Build admin message HTML: light card, subject, body, signature (matches design). */
function adminMessageHtml(body, subject, senderName) {
  const escaped = body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
  const inner = `
  ${lightLogoHeader()}
  ${lightEmailHeader(subject)}
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};"><div style="color:${L.text};font-size:15px;line-height:1.6;white-space:pre-wrap;">${escaped}</div></td></tr>
  ${lightSignature(senderName)}`;
  return `<!DOCTYPE html><html dir="ltr"><head><meta charset="utf-8" /></head>${lightWrapper(inner)}</html>`;
}

/** Build raw RFC822 message (multipart/alternative) for sending and appending to Sent. */
function buildAdminMessageRaw(to, subject, body, senderName, ccList = []) {
  const fromAddr = env.emailFrom || 'support@skyreachvisuals.co.uk';
  const fromHeader = `"SkyReach Visuals" <${fromAddr}>`;
  const dateHeader = new Date().toUTCString().replace(/GMT/, '+0000');
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const plainBody = body + adminSignatureText(senderName);
  const htmlBody = adminMessageHtml(body, subject, senderName);

  const ccNorm = Array.isArray(ccList) ? ccList.filter(Boolean) : [];
  const ccLine =
    ccNorm.length > 0
      ? `Cc: ${ccNorm.map((e) => `<${e.trim()}>`).join(', ')}`
      : null;

  const lines = [
    `From: ${fromHeader}`,
    `To: <${to}>`,
    ccLine,
    `Subject: ${subject}`,
    `Date: ${dateHeader}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    plainBody,
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody,
    `--${boundary}--`,
  ].filter((line) => line !== null && line !== '');
  return lines.join('\r\n');
}

export async function sendAdminMessage({ to, subject, body, senderName, cc }) {
  const transport = getTransporter();
  if (!transport) {
    console.log('SMTP not configured — skipping admin message email');
    console.log('Would send to:', to, 'Subject:', subject);
    return;
  }

  const fullSubject = subject.includes('| SkyReach') ? subject : `${subject} | SkyReach Visuals`;
  const ccList = normalizeAdminCc(cc);
  const raw = buildAdminMessageRaw(to, fullSubject, body, senderName, ccList);

  const envelopeTo = [to, ...ccList];
  await transport.sendMail({
    envelope: { from: env.emailFrom, to: envelopeTo },
    raw,
  });

  try {
    await appendToSent(raw);
  } catch (err) {
    console.error('Append to Sent failed:', err.message);
  }
}

function normalizeAdminCc(cc) {
  if (cc == null || cc === '') return [];
  const arr = Array.isArray(cc) ? cc : String(cc).split(/[,;\n\r]+/);
  return arr.map((s) => s.trim()).filter(Boolean);
}

export async function sendAdminLoginEmail({ to, name, verifyUrl }) {
  const transport = getTransporter();
  if (!transport) {
    console.warn('SMTP not configured — cannot send admin login verification email.');
    const err = new Error('SMTP not configured');
    err.code = 'SMTP_NOT_CONFIGURED';
    throw err;
  }

  const inner = `
  ${lightLogoHeader()}
  ${lightEmailHeader('Confirm your admin login')}
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};"><p style="margin:0;color:${L.textMuted};font-size:15px;line-height:1.6;">Hi ${name}, someone (hopefully you) is trying to sign in to your admin account. Click below to confirm.</p></td></tr>
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};">${lightCtaButton(verifyUrl, 'Confirm sign-in')}</td></tr>
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};"><p style="margin:0;color:${L.textFaint};font-size:12px;">This link expires in 15 minutes. If you didn't try to sign in, change your password immediately.</p></td></tr>
  ${lightSignature('SkyReach Visuals')}`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>${lightWrapper(inner)}</html>`;

  try {
    await transport.sendMail({
      from: `"SkyReach Visuals" <${env.emailFrom}>`,
      to,
      subject: 'Confirm your admin login | SkyReach Visuals',
      headers: mailHeaders(),
      html,
    });
    console.log('Admin login verification email sent to', to);
  } catch (err) {
    console.error('[VERIFY_EMAIL] sendMail failed', { to, code: err?.code, message: err?.message });
    throw err;
  }
}

export async function sendReviewRequestEmail({ to, name, booking, reviewUrl }) {
  const transport = getTransporter();
  if (!transport) {
    console.log('SMTP not configured — skipping review request email');
    console.log('Would send to:', to, 'Booking:', booking.id);
    return;
  }

  const inner = `
  ${lightLogoHeader()}
  ${lightEmailHeader('How was your experience?')}
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};"><p style="margin:0;color:${L.textMuted};font-size:15px;line-height:1.6;">Hi ${name}, your <strong style="color:${L.text};">${booking.packageName}</strong> order is complete. We hope you're happy with the results.</p></td></tr>
  <tr><td style="padding:0 40px 16px;background-color:${L.cardBg};"><p style="margin:0;color:${L.textMuted};font-size:14px;line-height:1.6;">We'd love a quick review — your feedback helps us improve and helps other customers decide.</p></td></tr>
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};">${lightCtaButton(reviewUrl, 'Leave a review')}</td></tr>
  <tr><td style="padding:0 40px 24px;background-color:${L.cardBg};"><p style="margin:0;color:${L.textFaint};font-size:13px;">Thank you for choosing SkyReach Visuals. Questions? Reply to this email or call 07877 691861.</p></td></tr>
  ${lightSignature('SkyReach Visuals')}`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>${lightWrapper(inner)}</html>`;

  await transport.sendMail({
    from: `"SkyReach Visuals" <${env.emailFrom}>`,
    to,
    subject: `How was your experience? — ${booking.packageName} | SkyReach Visuals`,
    headers: mailHeaders(),
    html,
  });
}
