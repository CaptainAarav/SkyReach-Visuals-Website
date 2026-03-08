import crypto from 'crypto';
import prisma from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword } from '../services/auth.service.js';

// ── Admin Audit Log helper ──────────────────────────────────────────
export async function logAdminAction(adminId, action, targetUserId, details) {
  return prisma.adminLog.create({
    data: { adminId, action, targetUserId: targetUserId || null, details },
  });
}

// ── Stats ───────────────────────────────────────────────────────────
export async function getStats(req, res, next) {
  try {
    const [total, admins, customerSupport, active, suspended, banned] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'CUSTOMER_SUPPORT' } }),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.user.count({ where: { status: 'BANNED' } }),
    ]);
    res.json({ success: true, data: { total, admins, customerSupport, active, suspended, banned }, error: null });
  } catch (err) {
    next(err);
  }
}

// ── Accounts ────────────────────────────────────────────────────────
export async function listAccounts(req, res, next) {
  try {
    const { search, role, status, sort } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const orderBy = sort === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' };

    const users = await prisma.user.findMany({
      where,
      orderBy,
      select: {
        id: true, name: true, email: true, role: true, status: true,
        emailVerified: true, lastLoginAt: true, createdAt: true,
      },
    });
    res.json({ success: true, data: users, error: null });
  } catch (err) {
    next(err);
  }
}

export async function getAccount(req, res, next) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, role: true, status: true,
        emailVerified: true, lastLoginAt: true, lastLoginIp: true,
        lastLoginLocation: true, createdAt: true,
      },
    });
    if (!user) throw new AppError('User not found', 404);

    const [ordersCount, messagesCount, reviewsCount] = await Promise.all([
      prisma.booking.count({ where: { userId: id } }),
      prisma.contactMessage.count({ where: { email: user.email } }),
      prisma.review.count({ where: { userId: id } }),
    ]);

    res.json({
      success: true,
      data: { ...user, ordersCount, messagesCount, reviewsCount },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateAccount(req, res, next) {
  try {
    const { id } = req.params;
    const { role, status, email, name } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);

    const validRoles = ['USER', 'ADMIN', 'CUSTOMER_SUPPORT'];
    if (role !== undefined && !validRoles.includes(role)) {
      throw new AppError('Valid roles are USER, ADMIN, or CUSTOMER_SUPPORT', 400);
    }

    const validStatuses = ['ACTIVE', 'SUSPENDED', 'BANNED'];
    if (status !== undefined && !validStatuses.includes(status)) {
      throw new AppError('Valid statuses are ACTIVE, SUSPENDED, or BANNED', 400);
    }

    if (req.user.role === 'CUSTOMER_SUPPORT') {
      if (role !== undefined) throw new AppError('Customer support cannot change roles', 403);
      if (status !== undefined && status === 'BANNED') throw new AppError('Customer support cannot ban accounts', 403);
    }

    if (email && email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) throw new AppError('Email is already in use', 409);
    }

    const data = {};
    if (role !== undefined) data.role = role;
    if (status !== undefined) data.status = status;
    if (email) data.email = email;
    if (name) data.name = name;

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    });

    const changes = [];
    if (role !== undefined && role !== user.role) changes.push(`Role: ${user.role} → ${role}`);
    if (status !== undefined && status !== user.status) changes.push(`Status: ${user.status} → ${status}`);
    if (email && email !== user.email) changes.push(`Email: ${user.email} → ${email}`);
    if (name && name !== user.name) changes.push(`Name: ${user.name} → ${name}`);
    if (changes.length > 0) {
      await logAdminAction(req.user.id, 'UPDATE_ACCOUNT', id, changes.join('; '));
    }

    res.json({ success: true, data: updated, error: null });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req, res, next) {
  try {
    const { id } = req.params;

    if (req.user.role !== 'ADMIN') {
      throw new AppError('Only admins can delete accounts', 403);
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);

    if (user.id === req.user.id) {
      throw new AppError('You cannot delete your own account', 400);
    }

    await logAdminAction(req.user.id, 'DELETE_ACCOUNT', id, `Deleted account: ${user.name} (${user.email})`);
    await prisma.user.delete({ where: { id } });

    res.json({ success: true, data: null, error: null });
  } catch (err) {
    next(err);
  }
}

export async function resetAccountPassword(req, res, next) {
  try {
    const { id } = req.params;

    if (req.user.role !== 'ADMIN') {
      throw new AppError('Only admins can reset passwords', 403);
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new AppError('User not found', 404);

    const tempPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await hashPassword(tempPassword);
    await prisma.user.update({ where: { id }, data: { passwordHash } });

    await logAdminAction(req.user.id, 'RESET_PASSWORD', id, `Reset password for ${user.name} (${user.email})`);

    res.json({
      success: true,
      data: { tempPassword, message: `Temporary password generated. Please share it securely with the user.` },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

// ── Account sub-routes (orders, messages, reviews for a user) ───────
export async function getAccountOrders(req, res, next) {
  try {
    const { id } = req.params;
    const orders = await prisma.booking.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: orders, error: null });
  } catch (err) {
    next(err);
  }
}

export async function getAccountMessages(req, res, next) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id }, select: { email: true } });
    if (!user) throw new AppError('User not found', 404);
    const messages = await prisma.contactMessage.findMany({
      where: { email: user.email },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: messages, error: null });
  } catch (err) {
    next(err);
  }
}

export async function getAccountReviews(req, res, next) {
  try {
    const { id } = req.params;
    const reviews = await prisma.review.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      include: { booking: { select: { packageName: true, shootDate: true } } },
    });
    res.json({ success: true, data: reviews, error: null });
  } catch (err) {
    next(err);
  }
}

// ── Orders ──────────────────────────────────────────────────────────
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

export async function updateOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { status, shootDate, shootTime, adminNotes } = req.body;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new AppError('Booking not found', 404);

    const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      throw new AppError('Valid status is required', 400);
    }

    const data = {};
    if (status) data.status = status;
    if (shootDate) data.shootDate = new Date(shootDate);
    if (shootTime !== undefined) data.shootTime = shootTime;
    if (adminNotes !== undefined) data.adminNotes = adminNotes;

    const updated = await prisma.booking.update({
      where: { id },
      data,
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    const changes = [];
    if (status && status !== booking.status) changes.push(`Status: ${booking.status} → ${status}`);
    if (shootDate) changes.push(`Shoot date updated`);
    if (shootTime !== undefined) changes.push(`Shoot time: ${shootTime || 'cleared'}`);
    if (adminNotes !== undefined) changes.push(`Admin notes updated`);
    if (changes.length > 0) {
      await logAdminAction(req.user.id, 'UPDATE_ORDER', null, `Order ${id}: ${changes.join('; ')}`);
    }

    res.json({ success: true, data: updated, error: null });
  } catch (err) {
    next(err);
  }
}

// ── Messages ────────────────────────────────────────────────────────
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
    if (!msg) throw new AppError('Message not found', 404);
    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { read: true },
    });
    res.json({ success: true, data: updated, error: null });
  } catch (err) {
    next(err);
  }
}

// ── Reviews ─────────────────────────────────────────────────────────
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

// ── Admin Logs ──────────────────────────────────────────────────────
export async function listAdminLogs(req, res, next) {
  try {
    const logs = await prisma.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        admin: { select: { id: true, name: true, email: true } },
        targetUser: { select: { id: true, name: true, email: true } },
      },
    });
    res.json({ success: true, data: logs, error: null });
  } catch (err) {
    next(err);
  }
}
