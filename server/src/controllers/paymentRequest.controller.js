import prisma from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';
import {
  sendPaymentRequestAccepted,
  sendPaymentRequestDeclined,
  sendPaymentRequestAdjusted,
} from '../services/email.service.js';

export async function createPaymentRequest(req, res, next) {
  try {
    const { customerEmail, customerName } = req.body;
    if (!customerEmail || typeof customerEmail !== 'string') {
      throw new AppError('Email is required', 400);
    }
    const email = customerEmail.trim().toLowerCase();
    const name = (customerName && typeof customerName === 'string') ? customerName.trim() : '';
    const pr = await prisma.paymentRequest.create({
      data: { customerEmail: email, customerName: name || email, status: 'PENDING' },
    });
    res.status(201).json({ success: true, data: { id: pr.id, message: 'Request sent. We\'ll email you once your payment link is ready.' }, error: null });
  } catch (err) {
    next(err);
  }
}

export async function listPaymentRequests(req, res, next) {
  try {
    const { status } = req.query;
    const where = {};
    if (status === 'pending') where.status = 'PENDING';
    else if (status === 'accepted') where.status = 'ACCEPTED';
    else if (status === 'declined') where.status = 'DECLINED';
    else if (status === 'adjusted') where.status = 'ADJUSTED';
    const list = await prisma.paymentRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: list, error: null });
  } catch (err) {
    next(err);
  }
}

export async function updatePaymentRequest(req, res, next) {
  try {
    const { id } = req.params;
    const { status, bookingId, adminNotes, adjustedAmount } = req.body;
    const pr = await prisma.paymentRequest.findUnique({ where: { id } });
    if (!pr) throw new AppError('Payment request not found', 404);
    if (pr.status !== 'PENDING') throw new AppError('Payment request has already been processed', 400);

    const validStatuses = ['ACCEPTED', 'DECLINED', 'ADJUSTED'];
    if (!status || !validStatuses.includes(status)) {
      throw new AppError('status must be one of ACCEPTED, DECLINED, ADJUSTED', 400);
    }

    const data = { status };
    if (adminNotes !== undefined) data.adminNotes = adminNotes;
    if (status === 'ACCEPTED' && bookingId) data.bookingId = bookingId;
    if (status === 'ADJUSTED' && adjustedAmount != null) data.adjustedAmount = Math.round(Number(adjustedAmount));

    const updated = await prisma.paymentRequest.update({
      where: { id },
      data,
    });

    const to = updated.customerEmail;
    const customerName = updated.customerName;
    try {
      if (updated.status === 'ACCEPTED' && updated.bookingId) {
        await sendPaymentRequestAccepted({
          to,
          customerName,
          payUrl: getPaymentLink(updated.bookingId),
        });
      } else if (updated.status === 'DECLINED') {
        await sendPaymentRequestDeclined({ to, customerName });
      } else if (updated.status === 'ADJUSTED') {
        await sendPaymentRequestAdjusted({
          to,
          customerName,
          adminNotes: updated.adminNotes ?? undefined,
          adjustedAmount: updated.adjustedAmount ?? undefined,
        });
      }
    } catch (emailErr) {
      console.error('Payment request email error:', emailErr);
    }
    res.json({ success: true, data: updated, error: null });
  } catch (err) {
    next(err);
  }
}

export function getPaymentLink(bookingId) {
  const base = (env.clientUrl || 'https://skyreachvisuals.co.uk').replace(/\/$/, '');
  return `${base}/booking/pay/${bookingId}`;
}
