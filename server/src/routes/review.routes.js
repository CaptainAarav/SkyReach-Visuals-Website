import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { deleteReview } from '../controllers/review.controller.js';

const router = Router();

router.delete('/:id', requireAuth, requireAdmin, deleteReview);

export default router;
