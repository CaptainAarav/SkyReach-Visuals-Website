import stripe from '../config/stripe.js';
import { env } from '../config/env.js';
import prisma from '../config/db.js';
import { sendBookingConfirmation } from '../services/email.service.js';

export async function handleStripeWebhook(req, res) {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.stripeWebhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const bookingId = session.metadata?.bookingId;

    if (bookingId) {
      try {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: { user: { select: { email: true } } },
        });

        if (booking && (booking.status === 'APPROVED' || booking.status === 'PENDING')) {
          const updated = await prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CONFIRMED', paidAt: new Date() },
          });

          await sendBookingConfirmation({
            to: booking.user.email,
            booking: { ...updated, user: booking.user },
          });
        }
      } catch (err) {
        console.error('Webhook processing error:', err);
      }
    }
  }

  res.json({ received: true });
}
