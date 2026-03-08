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
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      return next(new AppError('User not found', 401));
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
