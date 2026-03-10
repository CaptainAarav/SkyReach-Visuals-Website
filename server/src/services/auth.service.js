import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signToken(userId) {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

const COOKIE_MAX_AGE_MS = 10 * 365 * 24 * 60 * 60 * 1000; // 10 years
const COOKIE_SESSION_MS = 7 * 24 * 60 * 60 * 1000;       // 7 days when "Remember me" off

export function setCookieToken(res, token, options = {}) {
  const rememberMe = options.rememberMe !== false;
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: rememberMe ? COOKIE_MAX_AGE_MS : COOKIE_SESSION_MS,
  });
}

export function clearCookieToken(res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
  });
}
