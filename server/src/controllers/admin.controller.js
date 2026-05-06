import crypto from 'crypto';
import prisma from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword } from '../services/auth.service.js';
import { sendBookingApproved, sendBookingDeclined, sendAdminMessage, sendReviewRequestEmail, sendDirectInvoiceEmail } from '../services/email.service.js';
import { getInboxList, getSentList, getMessage } from '../services/imap.service.js';
import { generateInvoicePdf } from '../services/pdf-invoice.service.js';
import { createCheckoutSession } from '../services/stripe.service.js';
import { env } from '../config/env.js';
import { validatePrimaryEmail, normalizeAndValidateCcList } from '../utils/emailValidate.js';
import { findOrCreateUser } from '../services/findOrCreateUser.js';

// ── Admin Audit Log helper ──────────────────────────────────────────
export async function logAdminAction(adminId, action, targetUserId, details) {
  return prisma.adminLog.create({
    data: { adminId, action, targetUserId: targetUserId || null, details },
  });
}

// ── Stats ───────────────────────────────────────────────────────────
export async function getStats(req, res, next) {
  try {
    const { period } = req.query;

    let dateFilter = {};
    const now = new Date();
    if (period === 'monthly') {
      dateFilter = { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } };
    } else if (period === 'yearly') {
      dateFilter = { createdAt: { gte: new Date(now.getFullYear(), 0, 1) } };
    }

    const acceptedStatuses = ['APPROVED', 'CONFIRMED', 'COMPLETED'];

    const paidDateFilter = dateFilter.createdAt
      ? { paidAt: { not: null, ...dateFilter.createdAt } }
      : { paidAt: { not: null } };

    const externalDateFilter = dateFilter.createdAt ? { paidAt: dateFilter.createdAt } : {};

    const [
      total, admins, customerSupport, active, suspended, banned,
      totalQuotes, totalBookings, totalAccepted, totalDeclined,
      revenueResult,
      externalRevenueResult,
      siteSettings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'CUSTOMER_SUPPORT' } }),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.user.count({ where: { status: 'BANNED' } }),
      prisma.contactMessage.count({ where: dateFilter }),
      prisma.booking.count({ where: dateFilter }),
      prisma.booking.count({ where: { ...dateFilter, status: { in: acceptedStatuses } } }),
      prisma.booking.count({ where: { ...dateFilter, status: 'DECLINED' } }),
      prisma.booking.aggregate({
        _sum: { packagePrice: true },
        where: paidDateFilter,
      }),
      prisma.externalProject.aggregate({
        _sum: { amount: true },
        where: externalDateFilter,
      }),
      prisma.siteSettings.findUnique({ where: { id: 'site' } }),
    ]);

    const computedRevenue = (revenueResult._sum.packagePrice || 0) + (externalRevenueResult._sum.amount || 0);
    const revenue = siteSettings?.revenueOverridePence != null ? siteSettings.revenueOverridePence : computedRevenue;
    const displayTotalBookings = siteSettings?.totalBookingsOverride != null ? siteSettings.totalBookingsOverride : totalBookings;
    const displayTotalQuotes = siteSettings?.totalQuotesOverride != null ? siteSettings.totalQuotesOverride : totalQuotes;
    const displayTotalAccepted = siteSettings?.totalAcceptedOverride != null ? siteSettings.totalAcceptedOverride : totalAccepted;
    const displayTotalDeclined = siteSettings?.totalDeclinedOverride != null ? siteSettings.totalDeclinedOverride : totalDeclined;

    res.json({
      success: true,
      data: {
        total, admins, customerSupport, active, suspended, banned,
        totalQuotes: displayTotalQuotes,
        totalBookings: displayTotalBookings,
        totalAccepted: displayTotalAccepted,
        totalDeclined: displayTotalDeclined,
        revenue,
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/traffic?from=YYYY-MM-DD&to=YYYY-MM-DD — page views by day (staff). */
export async function getTraffic(req, res, next) {
  try {
    let from = req.query.from ? new Date(req.query.from + 'T00:00:00Z') : null;
    let to = req.query.to ? new Date(req.query.to + 'T23:59:59.999Z') : null;
    if (!from || !to || from > to) {
      const now = new Date();
      to = to || now;
      from = from || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    const views = await prisma.pageView.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const byDay = {};
    views.forEach((v) => {
      const d = v.createdAt.toISOString().slice(0, 10);
      byDay[d] = (byDay[d] || 0) + 1;
    });
    const daily = Object.entries(byDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, views]) => ({ date, views }));
    res.json({
      success: true,
      data: { daily, total: views.length },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/admin/traffic — reset all page views (sessions) to 0 (admin only). */
export async function resetTraffic(req, res, next) {
  try {
    await prisma.pageView.deleteMany({});
    await logAdminAction(req.user.id, 'RESET_TRAFFIC', null, 'All page views (sessions) reset to 0');
    res.json({ success: true, data: { message: 'Traffic reset.' }, error: null });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/admin/settings — update dashboard display overrides (admin only). */
export async function updateSiteSettings(req, res, next) {
  try {
    const body = req.body || {};
    const data = {};
    const intOverride = (key) => {
      const v = body[key];
      if (v === undefined) return;
      const n = v == null || v === '' ? null : Math.round(Number(v));
      data[key] = n !== null && !Number.isNaN(n) && n >= 0 ? n : null;
    };
    if (body.revenueOverridePence !== undefined) {
      const p = body.revenueOverridePence == null || body.revenueOverridePence === '' ? null : Math.round(Number(body.revenueOverridePence));
      data.revenueOverridePence = p !== null && !Number.isNaN(p) && p >= 0 ? p : null;
    }
    intOverride('totalBookingsOverride');
    intOverride('totalQuotesOverride');
    intOverride('totalAcceptedOverride');
    intOverride('totalDeclinedOverride');
    await prisma.siteSettings.upsert({
      where: { id: 'site' },
      create: { id: 'site', ...data },
      update: data,
    });
    await logAdminAction(req.user.id, 'UPDATE_SITE_SETTINGS', null, Object.keys(data).join(', '));
    res.json({ success: true, data: { message: 'Settings updated.' }, error: null });
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
      where: { userId: id, deletedAt: null },
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

// ── External projects (admin-only, revenue from outside website) ─────
export async function createExternalProject(req, res, next) {
  try {
    const { amount, label } = req.body;
    const amountPence = Math.round(Number(amount) * 100);
    if (!Number.isFinite(amountPence) || amountPence <= 0) {
      throw new AppError('Amount must be a positive number', 400);
    }
    const project = await prisma.externalProject.create({
      data: {
        amount: amountPence,
        label: label && String(label).trim() ? String(label).trim() : null,
      },
    });
    await logAdminAction(req.user.id, 'CREATE_EXTERNAL_PROJECT', null, `Amount: £${(amountPence / 100).toFixed(2)}${project.label ? ` — ${project.label}` : ''}`);
    res.status(201).json({ success: true, data: project, error: null });
  } catch (err) {
    next(err);
  }
}

// ── Transactions ────────────────────────────────────────────────────
export async function listTransactions(req, res, next) {
  try {
    const bookings = await prisma.booking.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    const data = bookings.map((b) => ({
      id: b.id,
      orderNumber: b.orderNumber,
      clientName: b.user?.name,
      clientEmail: b.user?.email,
      amount: b.packagePrice,
      status: b.paidAt ? 'completed' : (b.status === 'APPROVED' ? 'waiting_for_payment' : 'pending'),
      paidAt: b.paidAt,
      createdAt: b.createdAt,
      bookingStatus: b.status,
    }));
    res.json({ success: true, data, error: null });
  } catch (err) {
    next(err);
  }
}

// ── Orders ──────────────────────────────────────────────────────────
export async function listOrders(req, res, next) {
  try {
    const { status, sort = 'shootDate', order = 'asc', deleted } = req.query;
    const where = {};
    if (deleted === '1' || deleted === 'true') {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null;
    }
    if (status === 'accepted') {
      where.status = { in: ['APPROVED', 'CONFIRMED', 'COMPLETED'] };
    } else if (status === 'approved') {
      where.status = 'APPROVED';
      where.paidAt = null;
    } else if (status === 'declined') {
      where.status = 'DECLINED';
    } else if (status === 'pending') {
      where.status = 'PENDING';
    }
    const orderBy = sort === 'createdAt' ? { createdAt: order } : { shootDate: order };
    const orders = await prisma.booking.findMany({
      where,
      orderBy,
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json({ success: true, data: orders, error: null });
  } catch (err) {
    next(err);
  }
}

export async function deleteOrder(req, res, next) {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new AppError('Order not found', 404);
    await prisma.booking.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await logAdminAction(req.user.id, 'DELETE_ORDER', null, `Order ${id} (${booking.orderNumber}) moved to deleted`);
    res.json({ success: true, data: { id }, error: null });
  } catch (err) {
    next(err);
  }
}

export async function permanentDeleteOrder(req, res, next) {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new AppError('Order not found', 404);
    if (!booking.deletedAt) throw new AppError('Order must be deleted before it can be permanently removed', 400);
    await prisma.booking.delete({ where: { id } });
    await logAdminAction(req.user.id, 'PERMANENT_DELETE_ORDER', null, `Order ${id} (${booking.orderNumber}) permanently deleted`);
    res.json({ success: true, data: { id }, error: null });
  } catch (err) {
    next(err);
  }
}

/** POST /orders/reset-order-sequence — restart order number at 1 (admin only). Next new booking will get orderNumber 1. */
export async function resetOrderNumberSequence(req, res, next) {
  try {
    await prisma.$executeRawUnsafe(
      'ALTER SEQUENCE "Booking_orderNumber_seq" RESTART WITH 1'
    );
    await logAdminAction(req.user.id, 'RESET_ORDER_SEQUENCE', null, 'Order number sequence reset to 1');
    res.json({ success: true, data: { message: 'Order number sequence reset. Next order will be 1.' }, error: null });
  } catch (err) {
    next(err);
  }
}

/** GET or POST /orders/:id/invoice-preview — returns filled invoice PDF. GET: query quotedPrice. POST: body { quotedPrice, customerName, customerEmail, serviceName, location, invoiceDate } for editable fields. */
export async function getOrderInvoicePreview(req, res, next) {
  try {
    const { id } = req.params;
    const isPost = req.method === 'POST';
    const from = isPost ? req.body : req.query;
    const quotedPriceStr = from?.quotedPrice;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!booking) throw new AppError('Order not found', 404);

    let pricePenceOverride;
    if (quotedPriceStr != null && quotedPriceStr !== '') {
      const pounds = parseFloat(quotedPriceStr);
      if (!Number.isNaN(pounds) && pounds >= 0) pricePenceOverride = Math.round(pounds * 100);
    }

    const options = { pricePence: pricePenceOverride };
    if (isPost && from) {
      if (from.customerName !== undefined) options.customerName = String(from.customerName);
      if (from.customerEmail !== undefined) options.customerEmail = String(from.customerEmail);
      if (from.serviceName !== undefined) options.serviceName = String(from.serviceName);
      if (from.location !== undefined) options.location = String(from.location);
      if (from.invoiceDate !== undefined && from.invoiceDate !== '') options.invoiceDate = from.invoiceDate;
      if (from.shootDate !== undefined && from.shootDate !== '') options.shootDate = from.shootDate;
    }

    const pdfBuffer = await generateInvoicePdf(booking, booking.user, options);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="invoice-' + (booking.orderNumber ?? id) + '.pdf"');
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

/**
 * Shared: validate body, build PDF, optional Stripe session, email client. Updates booking totals to match the invoice.
 * @param {import('@prisma/client').Booking & { user: { id: string, name: string, email: string } }} booking
 */
async function deliverDirectInvoice(booking, body, adminUserId) {
  const {
    customerName,
    customerEmail,
    serviceName,
    location,
    shootDate,
    invoiceDate,
    quotedPrice,
    paymentMethod,
    ccEmails,
  } = body;

  validatePrimaryEmail(customerEmail);
  let ccList = normalizeAndValidateCcList(ccEmails);
  const toLower = String(customerEmail).trim().toLowerCase();
  ccList = ccList.filter((e) => e.toLowerCase() !== toLower);

  if (quotedPrice === undefined || quotedPrice === null || quotedPrice === '') {
    throw new AppError('Price is required', 400);
  }
  const priceNum = parseFloat(String(quotedPrice));
  if (Number.isNaN(priceNum) || priceNum <= 0) {
    throw new AppError('Please enter a valid price', 400);
  }
  const pricePence = Math.round(priceNum * 100);

  if (paymentMethod !== 'stripe' && paymentMethod !== 'bank_transfer') {
    throw new AppError('paymentMethod must be stripe or bank_transfer', 400);
  }

  if (!['PENDING', 'APPROVED'].includes(booking.status)) {
    throw new AppError('Order must be pending or approved to send a direct invoice', 400);
  }

  if (paymentMethod === 'bank_transfer') {
    const b = env.bank;
    if (!b.accountName || !b.sortCode || !b.accountNumber) {
      throw new AppError(
        'Bank transfer details are not configured. Set BANK_ACCOUNT_NAME, BANK_SORT_CODE, and BANK_ACCOUNT_NUMBER.',
        400
      );
    }
  }

  const pdfOptions = {
    pricePence,
    customerName: String(customerName ?? '').trim() || undefined,
    customerEmail: String(customerEmail ?? '').trim() || undefined,
    serviceName: String(serviceName ?? '').trim() || undefined,
    location: String(location ?? '').trim() || undefined,
    invoiceDate: invoiceDate || undefined,
    shootDate: shootDate || undefined,
    paymentMethod,
  };

  const mergedBooking = {
    ...booking,
    packagePrice: pricePence,
    packageName: pdfOptions.serviceName ?? booking.packageName,
    location: pdfOptions.location ?? booking.location,
    shootDate: shootDate ? new Date(shootDate) : booking.shootDate,
  };

  const mergedUser = {
    name: pdfOptions.customerName ?? booking.user?.name,
    email: pdfOptions.customerEmail ?? booking.user?.email,
  };

  const pdfBuffer = await generateInvoicePdf(mergedBooking, mergedUser, pdfOptions);

  const persistBookingFields = {
    packagePrice: pricePence,
    packageName: mergedBooking.packageName,
    location: mergedBooking.location,
    shootDate: mergedBooking.shootDate,
  };

  let checkoutUrl = null;
  if (paymentMethod === 'stripe') {
    try {
      const session = await createCheckoutSession({
        packageName: mergedBooking.packageName,
        priceInPence: pricePence,
        bookingId: booking.id,
        userEmail: String(customerEmail).trim(),
      });
      checkoutUrl = session.url;
      await prisma.booking.update({
        where: { id: booking.id },
        data: { ...persistBookingFields, stripeSessionId: session.id },
      });
    } catch (err) {
      if (err?.message === 'Stripe is not configured') {
        throw new AppError('Stripe is not configured', 503);
      }
      throw err;
    }
  } else {
    await prisma.booking.update({
      where: { id: booking.id },
      data: persistBookingFields,
    });
  }

  await sendDirectInvoiceEmail({
    to: String(customerEmail).trim(),
    cc: ccList,
    booking: mergedBooking,
    paymentMethod,
    checkoutUrl,
    pdfBuffer,
  });

  await logAdminAction(
    adminUserId,
    'SEND_DIRECT_INVOICE',
    booking.userId,
    `Direct invoice (${paymentMethod}) to ${customerEmail}${ccList.length ? `; CC: ${ccList.join(', ')}` : ''}, order ${booking.id}`
  );
}

/** POST /invoice-preview-draft — PDF preview before a booking exists (external customer flow). */
export async function postDraftInvoicePreview(req, res, next) {
  try {
    const { customerName, customerEmail, serviceName, location, shootDate, invoiceDate, quotedPrice } = req.body;

    validatePrimaryEmail(customerEmail);
    if (quotedPrice === undefined || quotedPrice === null || quotedPrice === '') {
      throw new AppError('Price is required', 400);
    }
    const priceNum = parseFloat(String(quotedPrice));
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      throw new AppError('Please enter a valid price', 400);
    }
    const pricePence = Math.round(priceNum * 100);

    const syntheticBooking = {
      orderNumber: null,
      packageName: String(serviceName || '').trim() || 'Service',
      packagePrice: pricePence,
      shootDate: shootDate ? new Date(shootDate) : new Date(),
      location: String(location || '').trim() || '—',
    };
    const syntheticUser = {
      name: String(customerName || '').trim() || '—',
      email: String(customerEmail || '').trim(),
    };
    const pdfOptions = {
      pricePence,
      customerName: syntheticUser.name,
      customerEmail: syntheticUser.email,
      serviceName: String(serviceName || '').trim() || undefined,
      location: String(location || '').trim() || undefined,
      invoiceDate: invoiceDate || undefined,
      shootDate: shootDate || undefined,
    };
    const pdfBuffer = await generateInvoicePdf(syntheticBooking, syntheticUser, pdfOptions);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="invoice-draft.pdf"');
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

/** POST /external-customer-direct-invoice — create PENDING EXTERNAL booking, then send invoice (orders + transactions). */
export async function createExternalCustomerDirectInvoice(req, res, next) {
  try {
    const { customerName, customerEmail, serviceName, location, shootDate, phone, quotedPrice } = req.body;

    validatePrimaryEmail(customerEmail);
    if (!String(customerName || '').trim()) throw new AppError('Customer name is required', 400);
    if (!String(serviceName || '').trim()) throw new AppError('Service is required', 400);
    if (quotedPrice === undefined || quotedPrice === null || quotedPrice === '') {
      throw new AppError('Price is required', 400);
    }
    const priceNum = parseFloat(String(quotedPrice));
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      throw new AppError('Please enter a valid price', 400);
    }
    const pricePence = Math.round(priceNum * 100);

    const user = await findOrCreateUser(String(customerEmail).trim(), String(customerName).trim());
    const shoot = shootDate ? new Date(shootDate) : new Date();
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        packageName: String(serviceName).trim(),
        packagePrice: pricePence,
        shootDate: shoot,
        location: String(location || '').trim() || '—',
        phone: phone != null && String(phone).trim() ? String(phone).trim() : '',
        status: 'PENDING',
        source: 'EXTERNAL',
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    await logAdminAction(
      req.user.id,
      'CREATE_EXTERNAL_INVOICE_ORDER',
      user.id,
      `External customer order ${booking.id} (#${booking.orderNumber}) for ${customerEmail}`
    );

    await deliverDirectInvoice(booking, req.body, req.user.id);
    res.status(201).json({
      success: true,
      data: { sent: true, bookingId: booking.id, orderNumber: booking.orderNumber },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

/** POST /orders/:id/send-direct-invoice — email invoice PDF + Stripe link or bank details. */
export async function sendDirectOrderInvoice(req, res, next) {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!booking || booking.deletedAt) throw new AppError('Order not found', 404);

    await deliverDirectInvoice(booking, req.body, req.user.id);

    res.json({ success: true, data: { sent: true }, error: null });
  } catch (err) {
    next(err);
  }
}

export async function updateOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { status, shootDate, shootTime, adminNotes, quotedPrice, invoiceOverrides } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!booking) throw new AppError('Booking not found', 404);

    const validStatuses = ['PENDING', 'APPROVED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'DECLINED'];
    if (status && !validStatuses.includes(status)) {
      throw new AppError('Valid status is required', 400);
    }

    const data = {};
    if (status) data.status = status;
    if (status === 'COMPLETED' && !booking.paidAt) {
      data.paidAt = new Date();
    }
    if (shootDate) data.shootDate = new Date(shootDate);
    if (shootTime !== undefined) data.shootTime = shootTime;
    if (adminNotes !== undefined) data.adminNotes = adminNotes;
    if (quotedPrice !== undefined && quotedPrice !== null) {
      data.packagePrice = Math.round(Number(quotedPrice));
    }

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
    if (quotedPrice !== undefined) changes.push(`Price set to ${quotedPrice}`);
    if (changes.length > 0) {
      await logAdminAction(req.user.id, 'UPDATE_ORDER', null, `Order ${id}: ${changes.join('; ')}`);
    }

    if (status === 'APPROVED' && booking.status !== 'APPROVED' && updated.user?.email) {
      const payUrl = `${env.clientUrl}/booking/pay/${booking.id}`;
      await sendBookingApproved({ to: updated.user.email, booking: updated, payUrl }).catch((err) => {
        console.error('Failed to send approval email:', err.message);
      });
    }

    if (status === 'DECLINED' && booking.status !== 'DECLINED' && updated.user?.email) {
      await sendBookingDeclined({ to: updated.user.email, booking: updated }).catch((err) => {
        console.error('Failed to send decline email:', err.message);
      });
    }

    if (status === 'COMPLETED' && booking.status !== 'COMPLETED' && updated.user?.email) {
      const reviewUrl = `${env.clientUrl}/dashboard/bookings/${booking.id}`;
      await sendReviewRequestEmail({
        to: updated.user.email,
        name: updated.user.name,
        booking: updated,
        reviewUrl,
      }).catch((err) => {
        console.error('Failed to send review request email:', err.message);
      });
    }

    res.json({ success: true, data: updated, error: null });
  } catch (err) {
    next(err);
  }
}

// ── Messages ────────────────────────────────────────────────────────
export async function listMessages(req, res, next) {
  try {
    const { read, archived } = req.query;
    const where = {};
    if (read === 'false') where.read = false;
    if (archived === 'true') where.archived = true;
    else if (archived === 'false') where.archived = false;
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

export async function markMessageArchived(req, res, next) {
  try {
    const { id } = req.params;
    const { archived } = req.body;
    const msg = await prisma.contactMessage.findUnique({ where: { id } });
    if (!msg) throw new AppError('Message not found', 404);
    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { archived: Boolean(archived) },
    });
    res.json({ success: true, data: updated, error: null });
  } catch (err) {
    next(err);
  }
}

export async function deleteMessage(req, res, next) {
  try {
    const { id } = req.params;
    const msg = await prisma.contactMessage.findUnique({ where: { id } });
    if (!msg) throw new AppError('Message not found', 404);
    await prisma.contactMessage.delete({ where: { id } });
    res.json({ success: true, data: { id }, error: null });
  } catch (err) {
    next(err);
  }
}

// ── Admin Messaging ──────────────────────────────────────────────────
export async function sendMessageToClient(req, res, next) {
  try {
    const { recipientEmail, subject, body, cc } = req.body;

    if (!recipientEmail || !subject || !body) {
      throw new AppError('Recipient email, subject, and body are required');
    }

    validatePrimaryEmail(recipientEmail);
    const toAddr = recipientEmail.trim();
    let ccList = normalizeAndValidateCcList(cc);
    ccList = ccList.filter((e) => e.toLowerCase() !== toAddr.toLowerCase());

    const recipient = await prisma.user.findUnique({
      where: { email: toAddr },
      select: { id: true },
    });

    const message = await prisma.adminMessage.create({
      data: {
        senderId: req.user.id,
        recipientId: recipient?.id || null,
        recipientEmail: toAddr,
        subject,
        body,
      },
    });

    const senderUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true },
    });

    await sendAdminMessage({
      to: toAddr,
      subject,
      body,
      senderName: senderUser?.name || 'Admin',
      cc: ccList,
    });

    await logAdminAction(
      req.user.id,
      'SEND_MESSAGE',
      recipient?.id || null,
      `Sent message to ${toAddr}${ccList.length ? ` (CC: ${ccList.join(', ')})` : ''}: ${subject}`
    );

    res.status(201).json({ success: true, data: message, error: null });
  } catch (err) {
    next(err);
  }
}

export async function listSentMessages(req, res, next) {
  try {
    const messages = await prisma.adminMessage.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        recipient: { select: { id: true, name: true, email: true } },
      },
    });
    res.json({ success: true, data: messages, error: null });
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
        booking: { select: { id: true, packageName: true, shootDate: true, location: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
    res.json({ success: true, data: reviews, error: null });
  } catch (err) {
    next(err);
  }
}

export async function updateReviewShowOnMainPage(req, res, next) {
  try {
    const { id } = req.params;
    const { showOnMainPage } = req.body;
    if (typeof showOnMainPage !== 'boolean') {
      throw new AppError('showOnMainPage must be a boolean', 400);
    }
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw new AppError('Review not found', 404);
    await prisma.review.update({
      where: { id },
      data: { showOnMainPage },
    });
    res.json({ success: true, data: { showOnMainPage }, error: null });
  } catch (err) {
    next(err);
  }
}

// ── Admin Logs ──────────────────────────────────────────────────────
export async function listAdminLogs(req, res, next) {
  try {
    const [logs, pageViews] = await Promise.all([
      prisma.adminLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          admin: { select: { id: true, name: true, email: true } },
          targetUser: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.pageView.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, path: true, createdAt: true },
      }),
    ]);
    res.json({ success: true, data: { auditLogs: logs, pageViews }, error: null });
  } catch (err) {
    next(err);
  }
}

// ── Live mailbox (IMAP) ──────────────────────────────────────────────
export async function getMailInbox(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 100);
    const list = await getInboxList(limit);
    res.json({ success: true, data: list, error: null });
  } catch (err) {
    if (err.code === 'IMAP_NOT_CONFIGURED') {
      return next(new AppError('Mailbox is not configured. Set IMAP_* or SMTP_USER/SMTP_PASS.', 503));
    }
    next(err);
  }
}

export async function getMailSent(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 100);
    const list = await getSentList(limit);
    res.json({ success: true, data: list, error: null });
  } catch (err) {
    if (err.code === 'IMAP_NOT_CONFIGURED') {
      return next(new AppError('Mailbox is not configured. Set IMAP_* or SMTP_USER/SMTP_PASS.', 503));
    }
    next(err);
  }
}

export async function getMailMessage(req, res, next) {
  try {
    const { folder, uid } = req.params;
    if (!folder || !uid) throw new AppError('Folder and UID required', 400);
    const normalized = folder.toUpperCase() === 'INBOX' ? 'INBOX' : 'Sent';
    const message = await getMessage(normalized, uid);
    if (!message) throw new AppError('Message not found', 404);
    res.json({ success: true, data: message, error: null });
  } catch (err) {
    if (err.code === 'IMAP_NOT_CONFIGURED') {
      return next(new AppError('Mailbox is not configured. Set IMAP_* or SMTP_USER/SMTP_PASS.', 503));
    }
    next(err);
  }
}

/** GET /api/admin/people?filter=quote|booking|direct — people who got a quote (contact), booking, or direct email. */
export async function getPeople(req, res, next) {
  try {
    const filter = (req.query.filter || '').toLowerCase();
    const allowed = ['quote', 'booking', 'direct'];
    const filterBy = allowed.includes(filter) ? filter : null;

    const [contacts, usersWithBookings, directRecipients] = await Promise.all([
      prisma.contactMessage.findMany({
        select: { email: true, name: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.findMany({
        where: { bookings: { some: {} } },
        select: { email: true, name: true },
      }),
      prisma.adminMessage.findMany({
        select: { recipientEmail: true },
      }),
    ]);

    const byEmail = new Map();
    contacts.forEach((c) => {
      const key = c.email.toLowerCase();
      if (!byEmail.has(key)) {
        byEmail.set(key, { email: c.email, name: c.name || c.email, sources: ['quote'] });
      }
    });
    usersWithBookings.forEach((u) => {
      const key = u.email.toLowerCase();
      const existing = byEmail.get(key);
      if (existing) {
        if (!existing.sources.includes('booking')) existing.sources.push('booking');
        if (u.name) existing.name = u.name;
      } else {
        byEmail.set(key, { email: u.email, name: u.name || u.email, sources: ['booking'] });
      }
    });
    directRecipients.forEach((a) => {
      const key = a.recipientEmail.toLowerCase();
      const existing = byEmail.get(key);
      if (existing) {
        if (!existing.sources.includes('direct')) existing.sources.push('direct');
      } else {
        byEmail.set(key, { email: a.recipientEmail, name: a.recipientEmail, sources: ['direct'] });
      }
    });

    let list = Array.from(byEmail.values());
    if (filterBy) {
      list = list.filter((p) => p.sources.includes(filterBy));
    }
    list.sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email, undefined, { sensitivity: 'base' }));

    res.json({ success: true, data: list, error: null });
  } catch (err) {
    next(err);
  }
}
