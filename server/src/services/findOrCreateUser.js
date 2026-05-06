import crypto from 'crypto';
import prisma from '../config/db.js';
import { hashPassword } from './auth.service.js';

/**
 * Find user by email (case-normalised) or create with a random password (for quote/quick-pay/external flows).
 */
export async function findOrCreateUser(email, name) {
  const key = email.trim().toLowerCase();
  let user = await prisma.user.findUnique({ where: { email: key } });
  if (!user) {
    const tempPassword = crypto.randomBytes(24).toString('base64url');
    const passwordHash = await hashPassword(tempPassword);
    user = await prisma.user.create({
      data: { email: key, name: (name || key).trim(), passwordHash, emailVerified: true },
    });
  }
  return user;
}
