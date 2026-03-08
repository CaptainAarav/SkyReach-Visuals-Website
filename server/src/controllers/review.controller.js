import prisma from '../config/db.js';
import { AppError } from '../utils/AppError.js';

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
