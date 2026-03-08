import stripe from '../config/stripe.js';
import { env } from '../config/env.js';

export async function createCheckoutSession({ packageName, priceInPence, bookingId, userEmail }) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: userEmail,
    line_items: [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `SkyReach Visuals — ${packageName}`,
          },
          unit_amount: priceInPence,
        },
        quantity: 1,
      },
    ],
    metadata: { bookingId },
    success_url: env.stripeSuccessUrl,
    cancel_url: env.stripeCancelUrl,
  });

  return session;
}

export async function retrieveSession(sessionId) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  return stripe.checkout.sessions.retrieve(sessionId);
}
