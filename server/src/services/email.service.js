import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
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

/** Light, minimal theme: white card on grey, clear hierarchy, accent highlights (inspired by verification-style emails). */
const L = {
  bodyBg: '#f4f4f5',
  cardBg: '#ffffff',
  cardShadow: '0 1px 3px rgba(0,0,0,0.08)',
  text: '#111827',
  textMuted: '#4b5563',
  textFaint: '#6b7280',
  border: '#e5e7eb',
  accent: '#C41E3A',
  accentLight: 'rgba(196, 30, 58, 0.08)',
  link: '#2563eb',
  buttonBg: '#C41E3A',
  buttonText: '#ffffff',
  footer: '#6b7280',
  font: "'Inter',Arial,sans-serif",
};

function emailHeader(title) {
  if (!title) return '';
  return `<tr>
  <td style="background-color:${EMAIL_DARK.cardBg};padding:24px 40px;text-align:left;border-radius:${EMAIL_RADIUS} ${EMAIL_RADIUS} 0 0;">
    <h1 style="margin:0;color:${EMAIL_DARK.text};font-size:20px;font-weight:600;font-family:'Inter',Arial,sans-serif;">${title}</h1>
  </td>
</tr>`;
}

function emailFooter() {
  return darkSignature('SkyReach');
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

/** Light layout: outer grey, centered white card with shadow. */
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

/** Logo at top of white card (light theme). */
function lightLogoHeader() {
  return `<tr>
  <td style="padding:32px 40px 24px;text-align:left;border-radius:${EMAIL_RADIUS} ${EMAIL_RADIUS} 0 0;">
    <img src="${logoUrl()}" alt="SkyReach Visuals" width="120" height="40" style="display:block;max-width:120px;height:auto;" />
  </td>
</tr>`;
}

/** Highlight box for key info (e.g. amount, order number, code). */
function lightHighlight(htmlContent) {
  return `<div style="background-color:${L.accentLight};border-radius:8px;padding:16px 20px;margin:20px 0;text-align:center;">
    <span style="font-size:22px;font-weight:700;color:${L.text};font-family:${L.font};">${htmlContent}</span>
  </div>`;
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
  ${emailHeader('Booking confirmed')}
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 24px;"><p style="margin:0;color:${EMAIL_DARK.textMuted};font-size:15px;line-height:1.6;">Thanks for booking with us. Here are your details:</p></td></tr>
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px;">${darkHighlight(`Order ${orderNo} &middot; ${amount}`)}</td></tr>
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-family:'Inter',Arial,sans-serif;">
      <tr><td style="padding:8px 0;color:${EMAIL_DARK.textFaint};font-size:13px;">Service</td><td style="padding:8px 0;color:${EMAIL_DARK.text};font-size:15px;font-weight:600;">${booking.packageName}</td></tr>
      <tr><td style="padding:8px 0;color:${EMAIL_DARK.textFaint};font-size:13px;">Date</td><td style="padding:8px 0;color:${EMAIL_DARK.text};font-size:15px;">${shootDate}</td></tr>
      ${booking.shootTime ? `<tr><td style="padding:8px 0;color:${EMAIL_DARK.textFaint};font-size:13px;">Time</td><td style="padding:8px 0;color:${EMAIL_DARK.text};font-size:15px;">${booking.shootTime}</td></tr>` : ''}
      <tr><td style="padding:8px 0;color:${EMAIL_DARK.textFaint};font-size:13px;">Location</td><td style="padding:8px 0;color:${EMAIL_DARK.text};font-size:15px;">${booking.location || '—'}</td></tr>
    </table>
    <p style="margin:24px 0 0;color:${EMAIL_DARK.textMuted};font-size:14px;line-height:1.6;">We'll be in touch within 24 hours to confirm the final details. If you have any questions, reply to this email or call us on 07877 691861.</p>
  </td></tr>
  ${darkSignature('SkyReach Visuals')}`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>${darkWrapper(inner)}</html>`;

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
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:${EMAIL_DARK.bodyBg};font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_DARK.bodyBg};padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          ${emailHeader('Payment link ready')}
          <tr>
            <td style="background-color:${EMAIL_DARK.cardBg};padding:40px;text-align:left;">
              <p style="margin:0 0 24px;color:${EMAIL_DARK.text};font-size:15px;line-height:1.6;">
                Hi ${name}, your payment request has been accepted. Use the link below to complete your payment securely.
              </p>
              <p style="margin:0 0 24px;">
                <a href="${payUrl}" style="display:inline-block;background-color:${EMAIL_DARK.buttonBg};color:${EMAIL_DARK.buttonText};text-decoration:none;font-size:16px;font-weight:600;padding:14px 28px;border-radius:8px;">Pay Now</a>
              </p>
              <p style="margin:0;color:${EMAIL_DARK.textMuted};font-size:14px;line-height:1.6;">
                If you have any questions, reply to this email or call us on 07877 691861.
              </p>
            </td>
          </tr>
          ${emailFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:${EMAIL_DARK.bodyBg};font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_DARK.bodyBg};padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          ${emailHeader('Payment request update')}
          <tr>
            <td style="background-color:${EMAIL_DARK.cardBg};padding:40px;text-align:left;">
              <p style="margin:0 0 24px;color:${EMAIL_DARK.text};font-size:15px;line-height:1.6;">
                Hi ${name}, we're unable to proceed with your payment request at this time.
              </p>
              <p style="margin:0;color:${EMAIL_DARK.textMuted};font-size:14px;line-height:1.6;">
                If you have questions, reply to this email or call us on 07877 691861.
              </p>
            </td>
          </tr>
          ${emailFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
  const amountLine = adjustedAmount != null ? `<p style="margin:0 0 8px;color:${EMAIL_DARK.text};font-size:14px;"><strong>Revised amount:</strong> &pound;${(adjustedAmount / 100).toFixed(2)}</p>` : '';
  const notesLine = adminNotes ? `<p style="margin:0 0 16px;color:${EMAIL_DARK.text};font-size:14px;line-height:1.6;">${adminNotes}</p>` : '';
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:${EMAIL_DARK.bodyBg};font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_DARK.bodyBg};padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          ${emailHeader('Payment request update')}
          <tr>
            <td style="background-color:${EMAIL_DARK.cardBg};padding:40px;text-align:left;">
              <p style="margin:0 0 24px;color:${EMAIL_DARK.text};font-size:15px;line-height:1.6;">
                Hi ${name}, your payment request has been updated with the details below.
              </p>
              ${amountLine}
              ${notesLine}
              <p style="margin:0;color:${EMAIL_DARK.textMuted};font-size:14px;line-height:1.6;">
                We'll be in touch with a payment link if applicable, or reply to this email / call 07877 691861 with any questions.
              </p>
            </td>
          </tr>
          ${emailFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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

  const locationLine = location ? `<tr><td style="padding:6px 0;color:${EMAIL_DARK.textFaint};font-size:13px;">Location</td><td style="padding:6px 0;color:${EMAIL_DARK.text};font-size:14px;">${location}</td></tr>` : '';
  const serviceTypeLine = serviceType ? `<tr><td style="padding:6px 0;color:${EMAIL_DARK.textFaint};font-size:13px;">Service type</td><td style="padding:6px 0;color:${EMAIL_DARK.text};font-size:14px;">${serviceType}</td></tr>` : '';
  const extraDetailsLine = extraDetails ? `<tr><td colspan="2" style="padding:12px 0 6px;color:${EMAIL_DARK.text};font-size:14px;line-height:1.6;white-space:pre-wrap;">${extraDetails}</td></tr>` : '';
  const inner = `
  ${emailHeader('New enquiry')}
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-family:'Inter',Arial,sans-serif;font-size:14px;">
      <tr><td style="padding:6px 0;color:${EMAIL_DARK.textFaint};width:100px;">Name</td><td style="padding:6px 0;color:${EMAIL_DARK.text};">${name}</td></tr>
      <tr><td style="padding:6px 0;color:${EMAIL_DARK.textFaint};">Email</td><td style="padding:6px 0;color:${EMAIL_DARK.text};"><a href="mailto:${email}" style="color:${EMAIL_DARK.link};">${email}</a></td></tr>
      ${phone ? `<tr><td style="padding:6px 0;color:${EMAIL_DARK.textFaint};">Phone</td><td style="padding:6px 0;color:${EMAIL_DARK.text};">${phone}</td></tr>` : ''}
      ${locationLine}
      ${serviceTypeLine}
      ${extraDetailsLine}
    </table>
    <p style="margin:20px 0 0;padding-top:16px;border-top:1px solid ${EMAIL_DARK.border};color:${EMAIL_DARK.text};font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</p>
  </td></tr>
  ${darkSignature('SkyReach Visuals')}`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>${darkWrapper(inner)}</html>`;

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
  ${emailHeader('Verify your email')}
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 24px;"><p style="margin:0;color:${EMAIL_DARK.textMuted};font-size:15px;line-height:1.6;">Hi ${name}, thanks for signing up. Click the button below to verify your email address.</p></td></tr>
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 24px;">${darkCtaButton(verifyUrl, 'Verify my email')}</td></tr>
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 24px;"><p style="margin:0;color:${EMAIL_DARK.textFaint};font-size:13px;line-height:1.6;">If the button doesn't work, copy this link: <a href="${verifyUrl}" style="color:${EMAIL_DARK.link};word-break:break-all;">${verifyUrl}</a></p></td></tr>
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 24px;"><p style="margin:0;color:${EMAIL_DARK.textFaint};font-size:12px;">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p></td></tr>
  ${darkSignature('SkyReach Visuals')}`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>${darkWrapper(inner)}</html>`;

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

export async function sendBookingApproved({ to, booking, payUrl, invoicePdfBuffer }) {
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
  ${emailHeader('Booking approved')}
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 24px;"><p style="margin:0;color:${EMAIL_DARK.textMuted};font-size:15px;line-height:1.6;">Great news! Your booking request has been approved. Complete your payment below.</p></td></tr>
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px;">${darkHighlight(`Amount to pay: ${amount}`)}</td></tr>
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 16px;text-align:center;"><p style="margin:0;color:${EMAIL_DARK.textFaint};font-size:13px;">Order ${orderNo}</p></td></tr>
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 8px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-family:'Inter',Arial,sans-serif;font-size:14px;">
      <tr><td style="padding:6px 0;color:${EMAIL_DARK.textFaint};">Service</td><td style="padding:6px 0;color:${EMAIL_DARK.text};">${booking.packageName}</td></tr>
      <tr><td style="padding:6px 0;color:${EMAIL_DARK.textFaint};">Date</td><td style="padding:6px 0;color:${EMAIL_DARK.text};">${shootDate}</td></tr>
      ${booking.shootTime ? `<tr><td style="padding:6px 0;color:${EMAIL_DARK.textFaint};">Time</td><td style="padding:6px 0;color:${EMAIL_DARK.text};">${booking.shootTime}</td></tr>` : ''}
      ${booking.location ? `<tr><td style="padding:6px 0;color:${EMAIL_DARK.textFaint};">Location</td><td style="padding:6px 0;color:${EMAIL_DARK.text};">${booking.location}</td></tr>` : ''}
    </table>
  </td></tr>
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 24px;">${darkCtaButton(payUrl, 'Pay now')}</td></tr>
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 24px;"><p style="margin:0;color:${EMAIL_DARK.textMuted};font-size:14px;line-height:1.6;">Click the button above to pay securely via Stripe. Your invoice is attached. Questions? Reply to this email or call 07877 691861.</p></td></tr>
  ${darkSignature('SkyReach Visuals')}`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>${darkWrapper(inner)}</html>`;

  const mailOptions = {
    from: `"SkyReach Visuals" <${env.emailFrom}>`,
    to,
    subject: `Booking Approved — ${booking.packageName} | SkyReach Visuals`,
    headers: mailHeaders(),
    html,
  };
  if (invoicePdfBuffer && Buffer.isBuffer(invoicePdfBuffer)) {
    mailOptions.attachments = [{ filename: 'invoice.pdf', content: invoicePdfBuffer }];
  }
  await transport.sendMail(mailOptions);
}

export async function sendBookingDeclined({ to, booking }) {
  const transport = getTransporter();
  if (!transport) {
    console.log('SMTP not configured — skipping booking declined email');
    console.log('Would send to:', to, 'Booking:', booking.id);
    return;
  }

  const inner = `
  ${emailHeader('Booking update')}
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 24px;"><p style="margin:0;color:${EMAIL_DARK.textMuted};font-size:15px;line-height:1.6;">We're sorry, but we're unable to approve your request for <strong style="color:${EMAIL_DARK.text};">${booking.packageName}</strong> at this time.</p></td></tr>
  ${booking.adminNotes ? `<tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 16px;"><p style="margin:0;color:${EMAIL_DARK.text};font-size:14px;line-height:1.6;"><strong>Note:</strong> ${booking.adminNotes}</p></td></tr>` : ''}
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 24px;"><p style="margin:0;color:${EMAIL_DARK.textMuted};font-size:14px;line-height:1.6;">If you'd like to discuss alternatives, reply to this email or call us on 07877 691861.</p></td></tr>
  ${darkSignature('SkyReach Visuals')}`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>${darkWrapper(inner)}</html>`;

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

/** Build admin message HTML: dark card, subject, body, signature (matches compose preview). */
function adminMessageHtml(body, subject, senderName) {
  const escaped = body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
  const inner = `
  ${emailHeader(subject)}
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 24px;"><div style="color:${EMAIL_DARK.text};font-size:15px;line-height:1.6;white-space:pre-wrap;">${escaped}</div></td></tr>
  ${darkSignature(senderName)}`;
  return `<!DOCTYPE html><html dir="ltr"><head><meta charset="utf-8" /></head>${darkWrapper(inner)}</html>`;
}

/** Build raw RFC822 message (multipart/alternative) for sending and appending to Sent. */
function buildAdminMessageRaw(to, subject, body, senderName) {
  const fromAddr = env.emailFrom || 'support@skyreachvisuals.co.uk';
  const fromHeader = `"SkyReach Visuals" <${fromAddr}>`;
  const dateHeader = new Date().toUTCString().replace(/GMT/, '+0000');
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const plainBody = body + adminSignatureText(senderName);
  const htmlBody = adminMessageHtml(body, subject, senderName);

  const lines = [
    `From: ${fromHeader}`,
    `To: <${to}>`,
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
  ];
  return lines.join('\r\n');
}

export async function sendAdminMessage({ to, subject, body, senderName }) {
  const transport = getTransporter();
  if (!transport) {
    console.log('SMTP not configured — skipping admin message email');
    console.log('Would send to:', to, 'Subject:', subject);
    return;
  }

  const fullSubject = subject.includes('| SkyReach') ? subject : `${subject} | SkyReach Visuals`;
  const raw = buildAdminMessageRaw(to, fullSubject, body, senderName);

  await transport.sendMail({
    envelope: { from: env.emailFrom, to: [to] },
    raw,
  });

  try {
    await appendToSent(raw);
  } catch (err) {
    console.error('Append to Sent failed:', err.message);
  }
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
  ${emailHeader('Confirm your admin login')}
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 24px;"><p style="margin:0;color:${EMAIL_DARK.textMuted};font-size:15px;line-height:1.6;">Hi ${name}, someone (hopefully you) is trying to sign in to your admin account. Click below to confirm.</p></td></tr>
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 24px;">${darkCtaButton(verifyUrl, 'Confirm sign-in')}</td></tr>
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 24px;"><p style="margin:0;color:${EMAIL_DARK.textFaint};font-size:12px;">This link expires in 15 minutes. If you didn't try to sign in, change your password immediately.</p></td></tr>
  ${darkSignature('SkyReach Visuals')}`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>${darkWrapper(inner)}</html>`;

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
  ${emailHeader('How was your experience?')}
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 24px;"><p style="margin:0;color:${EMAIL_DARK.textMuted};font-size:15px;line-height:1.6;">Hi ${name}, your <strong style="color:${EMAIL_DARK.text};">${booking.packageName}</strong> order is complete. We hope you're happy with the results.</p></td></tr>
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 16px;"><p style="margin:0;color:${EMAIL_DARK.textMuted};font-size:14px;line-height:1.6;">We'd love a quick review — your feedback helps us improve and helps other customers decide.</p></td></tr>
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 24px;">${darkCtaButton(reviewUrl, 'Leave a review')}</td></tr>
  <tr><td style="background-color:${EMAIL_DARK.cardBg};padding:0 40px 24px;"><p style="margin:0;color:${EMAIL_DARK.textFaint};font-size:13px;">Thank you for choosing SkyReach Visuals. Questions? Reply to this email or call 07877 691861.</p></td></tr>
  ${darkSignature('SkyReach Visuals')}`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>${darkWrapper(inner)}</html>`;

  await transport.sendMail({
    from: `"SkyReach Visuals" <${env.emailFrom}>`,
    to,
    subject: `How was your experience? — ${booking.packageName} | SkyReach Visuals`,
    headers: mailHeaders(),
    html,
  });
}
