import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
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

function emailHeader(title) {
  if (!title) return '';
  return `<tr>
  <td style="background-color:${EMAIL_DARK.cardBg};padding:24px 40px;text-align:left;border-radius:${EMAIL_RADIUS} ${EMAIL_RADIUS} 0 0;">
    <h1 style="margin:0;color:${EMAIL_DARK.text};font-size:20px;font-weight:600;font-family:'Inter',Arial,sans-serif;">${title}</h1>
  </td>
</tr>`;
}

function emailFooter() {
  return `<tr>
  <td style="background-color:${EMAIL_DARK.cardBg};padding:24px 40px;text-align:left;border-radius:0 0 ${EMAIL_RADIUS} ${EMAIL_RADIUS};">
    <p style="margin:0 0 8px;"><img src="${logoUrl()}" alt="SkyReach Visuals" width="80" height="32" style="display:inline-block;border-radius:${EMAIL_LOGO_RADIUS};filter:brightness(0) invert(1);opacity:0.9;max-width:80px;" /></p>
    <p style="margin:0;color:${EMAIL_DARK.footer};font-size:12px;font-family:'Inter',Arial,sans-serif;">SkyReach Visuals &middot; Bournemouth, Dorset, UK</p>
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

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:${EMAIL_DARK.bodyBg};font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_DARK.bodyBg};padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          ${emailHeader('Booking confirmed')}
          <tr>
            <td style="background-color:${EMAIL_DARK.cardBg};padding:40px;text-align:left;">
              <p style="margin:0 0 24px;color:${EMAIL_DARK.text};font-size:15px;line-height:1.6;">
                Thanks for booking with us. Here are your details:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;max-width:400px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid ${EMAIL_DARK.border};text-align:left;">
                    <span style="color:${EMAIL_DARK.textFaint};font-size:13px;">Package</span><br/>
                    <strong style="color:${EMAIL_DARK.text};font-size:15px;">${booking.packageName}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid ${EMAIL_DARK.border};text-align:left;">
                    <span style="color:${EMAIL_DARK.textFaint};font-size:13px;">Shoot date</span><br/>
                    <strong style="color:${EMAIL_DARK.text};font-size:15px;">${shootDate}</strong>
                  </td>
                </tr>
                ${booking.shootTime ? `<tr>
                  <td style="padding:12px 0;border-bottom:1px solid ${EMAIL_DARK.border};text-align:left;">
                    <span style="color:${EMAIL_DARK.textFaint};font-size:13px;">Shoot time</span><br/>
                    <strong style="color:${EMAIL_DARK.text};font-size:15px;">${booking.shootTime}</strong>
                  </td>
                </tr>` : ''}
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid ${EMAIL_DARK.border};text-align:left;">
                    <span style="color:${EMAIL_DARK.textFaint};font-size:13px;">Location</span><br/>
                    <strong style="color:${EMAIL_DARK.text};font-size:15px;">${booking.location}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid ${EMAIL_DARK.border};text-align:left;">
                    <span style="color:${EMAIL_DARK.textFaint};font-size:13px;">Amount paid</span><br/>
                    <strong style="color:${EMAIL_DARK.text};font-size:15px;">&pound;${(booking.packagePrice / 100).toFixed(2)}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;text-align:left;">
                    <span style="color:${EMAIL_DARK.textFaint};font-size:13px;">Order No</span><br/>
                    <span style="color:${EMAIL_DARK.text};font-size:15px;font-weight:600;">${booking.orderNumber}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:${EMAIL_DARK.textMuted};font-size:14px;line-height:1.6;">
                We'll be in touch within 24 hours to confirm the final details of your shoot.
                If you have any questions in the meantime, reply to this email or call us on
                07877 691861.
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
    subject: `Booking Confirmed — ${booking.packageName} | SkyReach Visuals`,
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

  const locationLine = location ? `<p style="margin:0 0 8px;color:${EMAIL_DARK.text};font-size:14px;"><strong>Location:</strong> ${location}</p>` : '';
  const serviceTypeLine = serviceType ? `<p style="margin:0 0 8px;color:${EMAIL_DARK.text};font-size:14px;"><strong>Service type:</strong> ${serviceType}</p>` : '';
  const extraDetailsLine = extraDetails ? `<p style="margin:0 0 8px;color:${EMAIL_DARK.text};font-size:14px;"><strong>Extra details:</strong></p><p style="margin:0 0 16px;color:${EMAIL_DARK.text};font-size:14px;line-height:1.6;white-space:pre-wrap;">${extraDetails}</p>` : '';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:${EMAIL_DARK.bodyBg};font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_DARK.bodyBg};padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          ${emailHeader('New Enquiry')}
          <tr>
            <td style="background-color:${EMAIL_DARK.cardBg};padding:40px;text-align:left;">
              <p style="margin:0 0 8px;color:${EMAIL_DARK.text};font-size:14px;"><strong>Name:</strong> ${name}</p>
              <p style="margin:0 0 8px;color:${EMAIL_DARK.text};font-size:14px;"><strong>Email:</strong> ${email}</p>
              ${phone ? `<p style="margin:0 0 8px;color:${EMAIL_DARK.text};font-size:14px;"><strong>Phone:</strong> ${phone}</p>` : ''}
              ${locationLine}
              ${serviceTypeLine}
              ${extraDetailsLine}
              <hr style="border:none;border-top:1px solid ${EMAIL_DARK.border};margin:16px 0;" />
              <p style="margin:0;color:${EMAIL_DARK.text};font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</p>
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

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:${EMAIL_DARK.bodyBg};font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_DARK.bodyBg};padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          ${emailHeader()}
          <tr>
            <td style="background-color:${EMAIL_DARK.cardBg};padding:40px;text-align:center;border-radius:${EMAIL_RADIUS} ${EMAIL_RADIUS} 0 0;">
              <h2 style="margin:0 0 16px;color:${EMAIL_DARK.text};font-size:24px;font-weight:600;font-family:'Inter',Arial,sans-serif;">Verify your email</h2>
              <p style="margin:0 0 24px;color:${EMAIL_DARK.text};font-size:15px;line-height:1.6;">
                Hi ${name}, thanks for signing up. Please click the button below to verify your email address.
              </p>
              <p style="margin:0 0 24px;">
                <a href="${verifyUrl}" style="display:inline-block;background-color:${EMAIL_DARK.buttonBg};color:${EMAIL_DARK.buttonText};text-decoration:none;font-size:16px;font-weight:600;padding:14px 28px;border-radius:8px;">Verify my email</a>
              </p>
              <p style="margin:0;color:${EMAIL_DARK.textMuted};font-size:13px;line-height:1.6;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <a href="${verifyUrl}" style="color:${EMAIL_DARK.link};word-break:break-all;">${verifyUrl}</a>
              </p>
              <p style="margin:24px 0 0;color:${EMAIL_DARK.textFaint};font-size:12px;">
                This link expires in 24 hours. If you didn't create an account, you can ignore this email.
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

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:${EMAIL_DARK.bodyBg};font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_DARK.bodyBg};padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          ${emailHeader()}
          <tr>
            <td style="background-color:${EMAIL_DARK.cardBg};padding:40px;text-align:center;border-radius:${EMAIL_RADIUS} ${EMAIL_RADIUS} 0 0;">
              <h2 style="margin:0 0 16px;color:${EMAIL_DARK.text};font-size:24px;font-weight:600;font-family:'Inter',Arial,sans-serif;">Booking Approved</h2>
              <p style="margin:0 0 24px;color:${EMAIL_DARK.text};font-size:15px;line-height:1.6;">
                Great news! Your booking request has been approved. Here are your details:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;max-width:400px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid ${EMAIL_DARK.border};text-align:center;">
                    <span style="color:${EMAIL_DARK.textFaint};font-size:13px;">Service</span><br/>
                    <strong style="color:${EMAIL_DARK.text};font-size:15px;">${booking.packageName}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid ${EMAIL_DARK.border};text-align:center;">
                    <span style="color:${EMAIL_DARK.textFaint};font-size:13px;">Date</span><br/>
                    <strong style="color:${EMAIL_DARK.text};font-size:15px;">${shootDate}</strong>
                  </td>
                </tr>
                ${booking.shootTime ? `<tr>
                  <td style="padding:12px 0;border-bottom:1px solid ${EMAIL_DARK.border};text-align:center;">
                    <span style="color:${EMAIL_DARK.textFaint};font-size:13px;">Time</span><br/>
                    <strong style="color:${EMAIL_DARK.text};font-size:15px;">${booking.shootTime}</strong>
                  </td>
                </tr>` : ''}
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid ${EMAIL_DARK.border};text-align:center;">
                    <span style="color:${EMAIL_DARK.textFaint};font-size:13px;">Location</span><br/>
                    <strong style="color:${EMAIL_DARK.text};font-size:15px;">${booking.location}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid ${EMAIL_DARK.border};text-align:center;">
                    <span style="color:${EMAIL_DARK.textFaint};font-size:13px;">Amount to pay</span><br/>
                    <strong style="color:${EMAIL_DARK.text};font-size:15px;">&pound;${(booking.packagePrice / 100).toFixed(2)}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;text-align:center;">
                    <span style="color:${EMAIL_DARK.textFaint};font-size:13px;">Order No</span><br/>
                    <span style="color:${EMAIL_DARK.text};font-size:15px;font-weight:600;">${booking.orderNumber}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;">
                <a href="${payUrl}" style="display:inline-block;background-color:${EMAIL_DARK.buttonBg};color:${EMAIL_DARK.buttonText};text-decoration:none;font-size:16px;font-weight:600;padding:14px 28px;border-radius:8px;">Pay Now</a>
              </p>
              <p style="margin:0;color:${EMAIL_DARK.textMuted};font-size:14px;line-height:1.6;">
                Click the button above to complete your payment securely via Stripe. If you have any questions, reply to this email or call us on 07877 691861.
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
    subject: `Booking Approved — ${booking.packageName} | SkyReach Visuals`,
    headers: mailHeaders(),
    html,
  });
}

export async function sendBookingDeclined({ to, booking }) {
  const transport = getTransporter();
  if (!transport) {
    console.log('SMTP not configured — skipping booking declined email');
    console.log('Would send to:', to, 'Booking:', booking.id);
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:${EMAIL_DARK.bodyBg};font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_DARK.bodyBg};padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          ${emailHeader()}
          <tr>
            <td style="background-color:${EMAIL_DARK.cardBg};padding:40px;text-align:center;border-radius:${EMAIL_RADIUS} ${EMAIL_RADIUS} 0 0;">
              <h2 style="margin:0 0 16px;color:${EMAIL_DARK.text};font-size:24px;font-weight:600;font-family:'Inter',Arial,sans-serif;">Booking Update</h2>
              <p style="margin:0 0 16px;color:${EMAIL_DARK.text};font-size:15px;line-height:1.6;">
                Unfortunately, we are unable to accommodate your booking request for <strong>${booking.packageName}</strong> at this time.
              </p>
              ${booking.adminNotes ? `<p style="margin:0 0 16px;color:${EMAIL_DARK.text};font-size:14px;line-height:1.6;"><strong>Reason:</strong> ${booking.adminNotes}</p>` : ''}
              <p style="margin:0;color:${EMAIL_DARK.textMuted};font-size:14px;line-height:1.6;">
                If you'd like to discuss alternatives, please reply to this email or call us on 07877 691861. We'd love to help find a solution.
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

/** Build admin message HTML: real-email look, left-aligned, no logo at top, inline signature, small white logo at bottom. */
function adminMessageHtml(body, subject, senderName) {
  const escaped = body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
  const fromAddr = env.emailFrom || 'support@skyreachvisuals.co.uk';
  return `
<!DOCTYPE html>
<html dir="ltr">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:${EMAIL_DARK.bodyBg};font-family:'Inter',Arial,sans-serif;direction:ltr;text-align:left;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_DARK.bodyBg};padding:24px 20px;">
    <tr>
      <td align="left">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background-color:${EMAIL_DARK.cardBg};padding:32px 40px;text-align:left;border-radius:${EMAIL_RADIUS} ${EMAIL_RADIUS} 0 0;">
              <h2 style="margin:0 0 16px;color:${EMAIL_DARK.text};font-size:22px;font-weight:600;text-align:left;font-family:'Inter',Arial,sans-serif;">${subject}</h2>
              <p style="margin:0 0 24px;color:${EMAIL_DARK.text};font-size:15px;line-height:1.6;white-space:pre-wrap;text-align:left;font-family:'Inter',Arial,sans-serif;">${escaped}</p>
              <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid ${EMAIL_DARK.border};color:${EMAIL_DARK.textMuted};font-size:13px;line-height:1.5;text-align:left;">
                <strong style="color:${EMAIL_DARK.text};">SkyReach Visuals</strong><br/>
                ${senderName} &mdash; Drone Aerial Photography &amp; Inspection &middot; +44 7877691861 &middot; ${fromAddr}
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

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:${EMAIL_DARK.bodyBg};font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_DARK.bodyBg};padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          ${emailHeader()}
          <tr>
            <td style="background-color:${EMAIL_DARK.cardBg};padding:40px;text-align:center;border-radius:${EMAIL_RADIUS} ${EMAIL_RADIUS} 0 0;">
              <h2 style="margin:0 0 16px;color:${EMAIL_DARK.text};font-size:24px;font-weight:600;font-family:'Inter',Arial,sans-serif;">Confirm your admin login</h2>
              <p style="margin:0 0 24px;color:${EMAIL_DARK.text};font-size:15px;line-height:1.6;">
                Hi ${name}, someone (hopefully you) is trying to sign in to your admin account. Click below to confirm.
              </p>
              <p style="margin:0 0 24px;">
                <a href="${verifyUrl}" style="display:inline-block;background-color:${EMAIL_DARK.buttonBg};color:${EMAIL_DARK.buttonText};text-decoration:none;font-size:16px;font-weight:600;padding:14px 28px;border-radius:8px;">Confirm sign-in</a>
              </p>
              <p style="margin:0;color:${EMAIL_DARK.textMuted};font-size:13px;line-height:1.6;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <a href="${verifyUrl}" style="color:${EMAIL_DARK.link};word-break:break-all;">${verifyUrl}</a>
              </p>
              <p style="margin:24px 0 0;color:${EMAIL_DARK.textFaint};font-size:12px;">
                This link expires in 15 minutes. If you didn't try to sign in, change your password immediately.
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

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:${EMAIL_DARK.bodyBg};font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_DARK.bodyBg};padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          ${emailHeader()}
          <tr>
            <td style="background-color:${EMAIL_DARK.cardBg};padding:40px;text-align:center;border-radius:${EMAIL_RADIUS} ${EMAIL_RADIUS} 0 0;">
              <h2 style="margin:0 0 16px;color:${EMAIL_DARK.text};font-size:24px;font-weight:600;font-family:'Inter',Arial,sans-serif;">How was your experience?</h2>
              <p style="margin:0 0 24px;color:${EMAIL_DARK.text};font-size:15px;line-height:1.6;">
                Hi ${name}, your <strong>${booking.packageName}</strong> order is now complete. We hope you&rsquo;re happy with the results!
              </p>
              <p style="margin:0 0 24px;color:${EMAIL_DARK.text};font-size:15px;line-height:1.6;">
                We&rsquo;d really appreciate it if you could take a moment to leave a review. Your feedback helps us improve and helps other customers make informed decisions.
              </p>
              <p style="margin:0 0 24px;">
                <a href="${reviewUrl}" style="display:inline-block;background-color:${EMAIL_DARK.buttonBg};color:${EMAIL_DARK.buttonText};text-decoration:none;font-size:16px;font-weight:600;padding:14px 28px;border-radius:8px;">Leave a Review</a>
              </p>
              <p style="margin:0;color:${EMAIL_DARK.textMuted};font-size:14px;line-height:1.6;">
                Thank you for choosing SkyReach Visuals. If you have any questions, reply to this email or call us on 07877 691861.
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
    subject: `How was your experience? — ${booking.packageName} | SkyReach Visuals`,
    headers: mailHeaders(),
    html,
  });
}
