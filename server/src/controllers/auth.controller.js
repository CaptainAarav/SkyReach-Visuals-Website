import crypto from 'crypto';
import prisma from '../config/db.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import {
  hashPassword,
  comparePassword,
  signToken,
  setCookieToken,
  clearCookieToken,
} from '../services/auth.service.js';
import { sendVerificationEmail, sendAdminLoginEmail } from '../services/email.service.js';
import { logAdminAction } from './admin.controller.js';

const VERIFICATION_EXPIRY_HOURS = 24;

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required');
    }
    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('An account with this email already exists', 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, emailVerified: false },
      select: { id: true, name: true, email: true, role: true, emailVerified: true, createdAt: true },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
    await prisma.emailVerificationToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const verifyUrl = `${env.clientUrl}/verify-email?token=${token}`;
    try {
      await sendVerificationEmail({ to: user.email, name: user.name, verifyUrl });
    } catch (err) {
      console.error('Register: could not send verification email', err.message);
      throw new AppError('We could not send the verification email. Please try again or contact support.', 500);
    }

    await logAdminAction(user.id, 'REGISTER', null, `New account created: ${user.name} (${user.email})`).catch(() => {});

    res.status(201).json({
      success: true,
      data: { message: 'Check your email to verify your account', email: user.email },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (user.status === 'SUSPENDED') {
      throw new AppError('Your account has been suspended. Contact support for help.', 403);
    }
    if (user.status === 'BANNED') {
      throw new AppError('Your account has been banned.', 403);
    }

    if (!user.emailVerified) {
      throw new AppError('Please verify your email before signing in. Check your inbox for the verification link.', 403);
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      throw new AppError('Invalid credentials', 401);
    }

    if (user.role === 'ADMIN' || user.role === 'CUSTOMER_SUPPORT') {
      const adminToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await prisma.adminLoginToken.create({
        data: { userId: user.id, token: adminToken, expiresAt },
      });

      const verifyUrl = `${env.clientUrl}/admin-login-verify?token=${adminToken}`;
      try {
        await sendAdminLoginEmail({ to: user.email, name: user.name, verifyUrl });
      } catch (err) {
        console.error('[VERIFY_EMAIL] Admin login email failed', { code: err?.code, message: err?.message });
        if (err?.code === 'SMTP_NOT_CONFIGURED') {
          return res.json({
            success: true,
            data: {
              message: 'Check your email to complete sign-in',
              requiresAdminVerification: true,
              adminVerifyUrl: verifyUrl,
            },
            error: null,
          });
        }
        if (err?.code === 'EAUTH' || err?.code === 'ESOCKET' || err?.responseCode) {
          return res.json({
            success: true,
            data: {
              message: 'Check your email to complete sign-in',
              requiresAdminVerification: true,
              adminVerifyUrl: verifyUrl,
            },
            error: null,
          });
        }
        throw new AppError('Could not send login verification email. Please try again.', 500);
      }

      return res.json({
        success: true,
        data: { message: 'Check your email to complete sign-in', requiresAdminVerification: true },
        error: null,
      });
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip },
    });

    const token = signToken(user.id);
    setCookieToken(res, token);

    await logAdminAction(user.id, 'LOGIN', null, `User logged in: ${user.name} (${user.email}) from ${ip}`).catch(() => {});

    res.json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      throw new AppError('Verification link is invalid or expired', 400);
    }

    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!record) {
      throw new AppError('Verification link is invalid or expired', 400);
    }
    if (new Date() > record.expiresAt) {
      await prisma.emailVerificationToken.delete({ where: { id: record.id } }).catch(() => {});
      throw new AppError('Verification link has expired. Please request a new one.', 400);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      }),
      prisma.emailVerificationToken.delete({ where: { id: record.id } }),
    ]);

    const user = await prisma.user.findUnique({
      where: { id: record.userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    const jwt = signToken(user.id);
    setCookieToken(res, jwt);

    await logAdminAction(user.id, 'EMAIL_VERIFIED', null, `Email verified: ${user.name} (${user.email})`).catch(() => {});

    res.json({
      success: true,
      data: { message: 'Email verified. You are now signed in.', user },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }
    if (user.emailVerified) {
      throw new AppError('This email is already verified. You can sign in.', 400);
    }

    await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
    await prisma.emailVerificationToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const verifyUrl = `${env.clientUrl}/verify-email?token=${token}`;
    try {
      await sendVerificationEmail({ to: user.email, name: user.name, verifyUrl });
    } catch (err) {
      console.error('Resend verification: could not send email', err.message);
      throw new AppError('We could not send the verification email. Please try again or contact support.', 500);
    }

    res.json({
      success: true,
      data: { message: 'Verification email sent. Check your inbox.' },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function adminLoginVerify(req, res, next) {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      throw new AppError('Login verification link is invalid or expired', 400);
    }

    const record = await prisma.adminLoginToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!record) {
      throw new AppError('Login verification link is invalid or expired', 400);
    }
    if (new Date() > record.expiresAt) {
      await prisma.adminLoginToken.delete({ where: { id: record.id } }).catch(() => {});
      throw new AppError('Login verification link has expired. Please log in again.', 400);
    }

    const user = record.user;
    await prisma.adminLoginToken.delete({ where: { id: record.id } });

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip },
    });

    const jwt = signToken(user.id);
    setCookieToken(res, jwt);

    await logAdminAction(user.id, 'ADMIN_LOGIN', null, `Admin login verified: ${user.name} (${user.email}) from ${ip}`).catch(() => {});

    res.json({
      success: true,
      data: { message: 'Admin login verified.', user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt } },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  clearCookieToken(res);
  res.json({ success: true, data: null, error: null });
}

export async function me(req, res) {
  const { id, name, email, role, status, createdAt } = req.user;
  res.json({ success: true, data: { id, name, email, role, status, createdAt }, error: null });
}

export async function updateProfile(req, res, next) {
  try {
    const { name, email } = req.body;

    if (email && email !== req.user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new AppError('Email is already in use', 409);
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    res.json({ success: true, data: updated, error: null });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required');
    }
    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters');
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) {
      throw new AppError('Current password is incorrect', 401);
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    await logAdminAction(req.user.id, 'PASSWORD_CHANGED', null, `Password changed: ${req.user.name} (${req.user.email})`).catch(() => {});

    res.json({ success: true, data: null, error: null });
  } catch (err) {
    next(err);
  }
}
