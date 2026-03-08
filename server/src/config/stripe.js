import Stripe from 'stripe';
import { env } from './env.js';

const stripe = env.stripeSecretKey
  ? new Stripe(env.stripeSecretKey)
  : null;

export default stripe;
