import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createBooking,
  listBookings,
  getBooking,
  verifyBooking,
  createReview,
  payBooking,
} from '../controllers/booking.controller.js';

const router = Router();

router.post('/', requireAuth, createBooking);
router.get('/', requireAuth, listBookings);
router.get('/verify', requireAuth, verifyBooking);
router.get('/:id', requireAuth, getBooking);
router.post('/:id/pay', requireAuth, payBooking);
router.post('/:id/review', requireAuth, createReview);

export default router;
