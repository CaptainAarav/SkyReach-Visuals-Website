import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env') });

const required = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CLIENT_URL',
  'STRIPE_SUCCESS_URL',
  'STRIPE_CANCEL_URL',
  // SMTP/email optional — server skips sending if not set
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0 && process.env.NODE_ENV === 'production') {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

if (missing.length > 0) {
  console.warn(`Warning: Missing environment variables: ${missing.join(', ')}`);
}

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  stripeSuccessUrl: process.env.STRIPE_SUCCESS_URL,
  stripeCancelUrl: process.env.STRIPE_CANCEL_URL,
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  emailFrom: process.env.EMAIL_FROM,
};

if (process.env.NODE_ENV !== 'test') {
  const smtpOk = env.smtp.host && env.smtp.user && env.smtp.pass;
  console.log(smtpOk ? 'SMTP configured — verification and booking emails will be sent' : 'SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS (and EMAIL_FROM) for verification emails');
}
