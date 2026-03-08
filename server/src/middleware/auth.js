import { verifyToken } from '../services/auth.service.js';
import { AppError } from '../utils/AppError.js';
import prisma from '../config/db.js';

export async function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return next(new AppError('Not authenticated', 401));
  }

  try {
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    });

    if (!user) {
      return next(new AppError('User not found', 401));
    }

    if (user.status === 'SUSPENDED') {
      return next(new AppError('Your account has been suspended. Contact support for help.', 403));
    }
    if (user.status === 'BANNED') {
      return next(new AppError('Your account has been banned.', 403));
    }

    req.user = user;
    next();
  } catch {
    return next(new AppError('Invalid or expired token', 401));
  }
}

export async function requireAdmin(req, res, next) {
  if (!req.user) {
    return next(new AppError('Not authenticated', 401));
  }
  if (req.user.role !== 'ADMIN') {
    return next(new AppError('Admin access required', 403));
  }
  next();
}

export async function requireStaff(req, res, next) {
  if (!req.user) {
    return next(new AppError('Not authenticated', 401));
  }
  if (req.user.role !== 'ADMIN' && req.user.role !== 'CUSTOMER_SUPPORT') {
    return next(new AppError('Staff access required', 403));
  }
  next();
}
