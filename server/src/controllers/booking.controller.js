import prisma from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { getServiceBySlug } from '../data/packages.js';
import { createCheckoutSession, retrieveSession } from '../services/stripe.service.js';
import { sendBookingConfirmation } from '../services/email.service.js';

export async function createBooking(req, res, next) {
  try {
    const { serviceSlug, propertyAddress, preferredDate, timeWindow, phone, notes } = req.body;

    if (!serviceSlug || !propertyAddress || !preferredDate || !timeWindow || !phone) {
      throw new AppError('Service, property address, preferred date, time window, and phone are required');
    }

    const service = getServiceBySlug(serviceSlug);
    if (!service) {
      throw new AppError('Invalid service', 404);
    }

    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        packageName: service.name,
        packagePrice: service.basePrice,
        shootDate: new Date(preferredDate),
        shootTime: timeWindow,
        location: propertyAddress,
        phone,
        notes: notes || null,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      success: true,
      data: booking,
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function payBooking(req, res, next) {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.userId !== req.user.id) throw new AppError('Not authorised', 403);
    if (booking.status !== 'APPROVED') {
      throw new AppError('This booking is not ready for payment', 400);
    }

    const session = await createCheckoutSession({
      packageName: booking.packageName,
      priceInPence: booking.packagePrice,
      bookingId: booking.id,
      userEmail: req.user.email,
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { stripeSessionId: session.id },
    });

    res.json({
      success: true,
      data: { sessionUrl: session.url },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function listBookings(req, res, next) {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { reviews: true },
    });

    res.json({ success: true, data: bookings, error: null });
  } catch (err) {
    next(err);
  }
}

export async function getBooking(req, res, next) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { reviews: true },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }
    if (booking.userId !== req.user.id) {
      throw new AppError('Not authorised', 403);
    }

    res.json({ success: true, data: booking, error: null });
  } catch (err) {
    next(err);
  }
}

export async function createReview(req, res, next) {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!comment || !comment.trim()) {
      throw new AppError('Comment is required');
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { reviews: true },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }
    if (booking.userId !== req.user.id) {
      throw new AppError('Not authorised', 403);
    }
    if (booking.status !== 'COMPLETED') {
      throw new AppError('You can only review completed orders', 400);
    }
    if (booking.reviews.length > 0) {
      throw new AppError('You have already reviewed this order', 409);
    }

    const review = await prisma.review.create({
      data: {
        bookingId: id,
        userId: req.user.id,
        rating: rating != null ? Number(rating) : null,
        comment: comment.trim(),
      },
    });

    res.status(201).json({ success: true, data: review, error: null });
  } catch (err) {
    next(err);
  }
}

export async function updateBookingTime(req, res, next) {
  try {
    const { id } = req.params;
    const { shootTime } = req.body;

    if (!shootTime) throw new AppError('Shoot time is required');

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.userId !== req.user.id) throw new AppError('Not authorised', 403);
    if (booking.status !== 'APPROVED') {
      throw new AppError('Time can only be adjusted before payment', 400);
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { shootTime },
    });

    res.json({ success: true, data: updated, error: null });
  } catch (err) {
    next(err);
  }
}

export async function verifyBooking(req, res, next) {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      throw new AppError('Session ID is required');
    }

    const session = await retrieveSession(session_id);
    if (session.payment_status !== 'paid') {
      throw new AppError('Payment not completed');
    }

    const booking = await prisma.booking.findUnique({
      where: { stripeSessionId: session_id },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }
    if (booking.userId !== req.user.id) {
      throw new AppError('Not authorised', 403);
    }

    if (booking.status === 'APPROVED') {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'CONFIRMED', paidAt: new Date() },
      });

      await sendBookingConfirmation({
        to: req.user.email,
        booking: { ...booking, status: 'CONFIRMED' },
      });
    }

    const updated = await prisma.booking.findUnique({
      where: { id: booking.id },
    });

    res.json({ success: true, data: updated, error: null });
  } catch (err) {
    next(err);
  }
}
