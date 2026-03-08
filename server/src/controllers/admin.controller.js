import prisma from '../config/db.js';
import { AppError } from '../utils/AppError.js';

export async function listOrders(req, res, next) {
  try {
    const orders = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json({ success: true, data: orders, error: null });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const valid = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    if (!status || !valid.includes(status)) {
      throw new AppError('Valid status is required', 400);
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
    });
    res.json({ success: true, data: updated, error: null });
  } catch (err) {
    next(err);
  }
}

export async function listAccounts(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    res.json({ success: true, data: users, error: null });
  } catch (err) {
    next(err);
  }
}

export async function updateAccount(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (role !== undefined && role !== 'USER' && role !== 'ADMIN') {
      throw new AppError('Valid role is USER or ADMIN', 400);
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: role !== undefined ? { role } : {},
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    res.json({ success: true, data: updated, error: null });
  } catch (err) {
    next(err);
  }
}

export async function listMessages(req, res, next) {
  try {
    const read = req.query.read;
    const where = read === 'false' ? { read: false } : {};
    const messages = await prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: messages, error: null });
  } catch (err) {
    next(err);
  }
}

export async function markMessageRead(req, res, next) {
  try {
    const { id } = req.params;
    const msg = await prisma.contactMessage.findUnique({ where: { id } });
    if (!msg) {
      throw new AppError('Message not found', 404);
    }
    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { read: true },
    });
    res.json({ success: true, data: updated, error: null });
  } catch (err) {
    next(err);
  }
}

export async function listReviews(req, res, next) {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        booking: { select: { id: true, packageName: true, shootDate: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
    res.json({ success: true, data: reviews, error: null });
  } catch (err) {
    next(err);
  }
}
