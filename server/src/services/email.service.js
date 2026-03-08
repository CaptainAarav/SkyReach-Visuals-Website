import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (!transporter && env.smtp.host && env.smtp.user) {
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
    'List-Unsubscribe': `<mailto:${env.emailFrom}?subject=unsubscribe>`,
  };
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
<body style="margin:0;padding:0;background-color:#F5F3EE;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F3EE;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#1E2D4A;padding:32px 40px;">
              <h1 style="margin:0;color:#F5F3EE;font-size:20px;font-weight:600;">SkyReach Visuals</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;">
              <h2 style="margin:0 0 16px;color:#1E2D4A;font-size:24px;font-weight:600;">Booking confirmed</h2>
              <p style="margin:0 0 24px;color:#1E2D4A;font-size:15px;line-height:1.6;">
                Thanks for booking with us. Here are your details:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #E8E4DB;">
                    <span style="color:#1E2D4A;font-size:13px;opacity:0.5;">Package</span><br/>
                    <strong style="color:#1E2D4A;font-size:15px;">${booking.packageName}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #E8E4DB;">
                    <span style="color:#1E2D4A;font-size:13px;opacity:0.5;">Shoot date</span><br/>
                    <strong style="color:#1E2D4A;font-size:15px;">${shootDate}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #E8E4DB;">
                    <span style="color:#1E2D4A;font-size:13px;opacity:0.5;">Location</span><br/>
                    <strong style="color:#1E2D4A;font-size:15px;">${booking.location}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #E8E4DB;">
                    <span style="color:#1E2D4A;font-size:13px;opacity:0.5;">Amount paid</span><br/>
                    <strong style="color:#1E2D4A;font-size:15px;">&pound;${(booking.packagePrice / 100).toFixed(2)}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <span style="color:#1E2D4A;font-size:13px;opacity:0.5;">Reference</span><br/>
                    <span style="color:#1E2D4A;font-size:13px;font-family:monospace;">${booking.id}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#1E2D4A;font-size:14px;line-height:1.6;opacity:0.7;">
                We'll be in touch within 24 hours to confirm the final details of your shoot.
                If you have any questions in the meantime, reply to this email or call us on
                07877 691861.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#1E2D4A;font-size:12px;opacity:0.4;">
                SkyReach Visuals &middot; Bournemouth, Dorset, UK
              </p>
            </td>
          </tr>
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

  const locationLine = location ? `<p style="margin:0 0 8px;color:#1E2D4A;font-size:14px;"><strong>Location:</strong> ${location}</p>` : '';
  const serviceTypeLine = serviceType ? `<p style="margin:0 0 8px;color:#1E2D4A;font-size:14px;"><strong>Service type:</strong> ${serviceType}</p>` : '';
  const extraDetailsLine = extraDetails ? `<p style="margin:0 0 8px;color:#1E2D4A;font-size:14px;"><strong>Extra details:</strong></p><p style="margin:0 0 16px;color:#1E2D4A;font-size:14px;line-height:1.6;white-space:pre-wrap;">${extraDetails}</p>` : '';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:#F5F3EE;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F3EE;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background-color:#1E2D4A;padding:32px 40px;">
              <h1 style="margin:0;color:#F5F3EE;font-size:20px;font-weight:600;">New Enquiry</h1>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;padding:40px;">
              <p style="margin:0 0 8px;color:#1E2D4A;font-size:14px;"><strong>Name:</strong> ${name}</p>
              <p style="margin:0 0 8px;color:#1E2D4A;font-size:14px;"><strong>Email:</strong> ${email}</p>
              ${phone ? `<p style="margin:0 0 8px;color:#1E2D4A;font-size:14px;"><strong>Phone:</strong> ${phone}</p>` : ''}
              ${locationLine}
              ${serviceTypeLine}
              ${extraDetailsLine}
              <hr style="border:none;border-top:1px solid #E8E4DB;margin:16px 0;" />
              <p style="margin:0;color:#1E2D4A;font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transport.sendMail({
    from: `"SkyReach Visuals" <${env.emailFrom}>`,
    to: env.emailFrom,
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
<body style="margin:0;padding:0;background-color:#F5F3EE;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F3EE;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background-color:#1E2D4A;padding:32px 40px;">
              <h1 style="margin:0;color:#F5F3EE;font-size:20px;font-weight:600;">SkyReach Visuals</h1>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;padding:40px;">
              <h2 style="margin:0 0 16px;color:#1E2D4A;font-size:24px;font-weight:600;">Verify your email</h2>
              <p style="margin:0 0 24px;color:#1E2D4A;font-size:15px;line-height:1.6;">
                Hi ${name}, thanks for signing up. Please click the button below to verify your email address.
              </p>
              <p style="margin:0 0 24px;">
                <a href="${verifyUrl}" style="display:inline-block;background-color:#C41E3A;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 28px;border-radius:8px;">Verify my email</a>
              </p>
              <p style="margin:0;color:#1E2D4A;font-size:13px;line-height:1.6;opacity:0.7;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <a href="${verifyUrl}" style="color:#C41E3A;word-break:break-all;">${verifyUrl}</a>
              </p>
              <p style="margin:24px 0 0;color:#1E2D4A;font-size:12px;opacity:0.6;">
                This link expires in 24 hours. If you didn't create an account, you can ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#1E2D4A;font-size:12px;opacity:0.4;">SkyReach Visuals · Bournemouth, Dorset, UK</p>
            </td>
          </tr>
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
<body style="margin:0;padding:0;background-color:#F5F3EE;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F3EE;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background-color:#1E2D4A;padding:32px 40px;">
              <h1 style="margin:0;color:#F5F3EE;font-size:20px;font-weight:600;">SkyReach Visuals</h1>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;padding:40px;">
              <h2 style="margin:0 0 16px;color:#1E2D4A;font-size:24px;font-weight:600;">Booking Approved</h2>
              <p style="margin:0 0 24px;color:#1E2D4A;font-size:15px;line-height:1.6;">
                Great news! Your booking request has been approved. Here are your details:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #E8E4DB;">
                    <span style="color:#1E2D4A;font-size:13px;opacity:0.5;">Service</span><br/>
                    <strong style="color:#1E2D4A;font-size:15px;">${booking.packageName}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #E8E4DB;">
                    <span style="color:#1E2D4A;font-size:13px;opacity:0.5;">Date</span><br/>
                    <strong style="color:#1E2D4A;font-size:15px;">${shootDate}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #E8E4DB;">
                    <span style="color:#1E2D4A;font-size:13px;opacity:0.5;">Location</span><br/>
                    <strong style="color:#1E2D4A;font-size:15px;">${booking.location}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <span style="color:#1E2D4A;font-size:13px;opacity:0.5;">Amount to pay</span><br/>
                    <strong style="color:#1E2D4A;font-size:15px;">&pound;${(booking.packagePrice / 100).toFixed(2)}</strong>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;">
                <a href="${payUrl}" style="display:inline-block;background-color:#C41E3A;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 28px;border-radius:8px;">Pay Now</a>
              </p>
              <p style="margin:0;color:#1E2D4A;font-size:14px;line-height:1.6;opacity:0.7;">
                Click the button above to complete your payment securely via Stripe. If you have any questions, reply to this email or call us on 07877 691861.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#1E2D4A;font-size:12px;opacity:0.4;">
                SkyReach Visuals &middot; Bournemouth, Dorset, UK
              </p>
            </td>
          </tr>
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
<body style="margin:0;padding:0;background-color:#F5F3EE;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F3EE;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background-color:#1E2D4A;padding:32px 40px;">
              <h1 style="margin:0;color:#F5F3EE;font-size:20px;font-weight:600;">SkyReach Visuals</h1>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;padding:40px;">
              <h2 style="margin:0 0 16px;color:#1E2D4A;font-size:24px;font-weight:600;">Booking Update</h2>
              <p style="margin:0 0 16px;color:#1E2D4A;font-size:15px;line-height:1.6;">
                Unfortunately, we are unable to accommodate your booking request for <strong>${booking.packageName}</strong> at this time.
              </p>
              ${booking.adminNotes ? `<p style="margin:0 0 16px;color:#1E2D4A;font-size:14px;line-height:1.6;"><strong>Reason:</strong> ${booking.adminNotes}</p>` : ''}
              <p style="margin:0;color:#1E2D4A;font-size:14px;line-height:1.6;opacity:0.7;">
                If you'd like to discuss alternatives, please reply to this email or call us on 07877 691861. We'd love to help find a solution.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#1E2D4A;font-size:12px;opacity:0.4;">
                SkyReach Visuals &middot; Bournemouth, Dorset, UK
              </p>
            </td>
          </tr>
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
<body style="margin:0;padding:0;background-color:#F5F3EE;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F3EE;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background-color:#1E2D4A;padding:32px 40px;">
              <h1 style="margin:0;color:#F5F3EE;font-size:20px;font-weight:600;">SkyReach Visuals</h1>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;padding:40px;">
              <h2 style="margin:0 0 16px;color:#1E2D4A;font-size:24px;font-weight:600;">Confirm your admin login</h2>
              <p style="margin:0 0 24px;color:#1E2D4A;font-size:15px;line-height:1.6;">
                Hi ${name}, someone (hopefully you) is trying to sign in to your admin account. Click below to confirm.
              </p>
              <p style="margin:0 0 24px;">
                <a href="${verifyUrl}" style="display:inline-block;background-color:#C41E3A;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 28px;border-radius:8px;">Confirm sign-in</a>
              </p>
              <p style="margin:0;color:#1E2D4A;font-size:13px;line-height:1.6;opacity:0.7;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <a href="${verifyUrl}" style="color:#C41E3A;word-break:break-all;">${verifyUrl}</a>
              </p>
              <p style="margin:24px 0 0;color:#1E2D4A;font-size:12px;opacity:0.6;">
                This link expires in 15 minutes. If you didn't try to sign in, change your password immediately.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#1E2D4A;font-size:12px;opacity:0.4;">SkyReach Visuals &middot; Bournemouth, Dorset, UK</p>
            </td>
          </tr>
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
    console.error('Failed to send admin login email to', to, err.message);
    throw err;
  }
}
