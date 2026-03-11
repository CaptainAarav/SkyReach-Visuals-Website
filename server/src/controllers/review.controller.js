import prisma from '../config/db.js';
import { AppError } from '../utils/AppError.js';

export async function getPublicReviews(req, res, next) {
  try {
    const reviews = await prisma.review.findMany({
      where: { rating: { not: null }, showOnMainPage: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { name: true } },
        booking: { select: { packageName: true, location: true } },
      },
    });

    const data = reviews.map((r) => ({
      id: r.id,
      name: r.user.name,
      rating: r.rating,
      comment: r.comment,
      packageName: r.booking.packageName,
      location: r.booking.location || null,
      createdAt: r.createdAt,
    }));

    res.json({ success: true, data, error: null });
  } catch (err) {
    next(err);
  }
}

export async function deleteReview(req, res, next) {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    await prisma.review.delete({
      where: { id },
    });

    res.json({ success: true, data: null, error: null });
  } catch (err) {
    next(err);
  }
}
