import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { getPublicReviews, deleteReview } from '../controllers/review.controller.js';

const router = Router();

router.get('/public', getPublicReviews);
router.delete('/:id', requireAuth, requireAdmin, deleteReview);

export default router;
