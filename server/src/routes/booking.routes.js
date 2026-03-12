import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createBooking,
  createQuoteRequest,
  createQuickPayRequest,
  listBookings,
  getBooking,
  getBookingByOrderNumber,
  getBookingsByCustomer,
  getInvoice,
  verifyBooking,
  createReview,
  payBooking,
  updateBookingTime,
} from '../controllers/booking.controller.js';

const router = Router();

router.get('/by-order/:orderNumber', getBookingByOrderNumber);
router.get('/by-customer', getBookingsByCustomer);
router.post('/by-customer', getBookingsByCustomer);
router.post('/quote-requests', createQuoteRequest);
router.post('/quick-pay', createQuickPayRequest);
router.post('/', requireAuth, createBooking);
router.get('/', requireAuth, listBookings);
router.get('/verify', requireAuth, verifyBooking);
router.get('/:id', requireAuth, getBooking);
router.get('/:id/invoice', requireAuth, getInvoice);
router.post('/:id/pay', requireAuth, payBooking);
router.patch('/:id/time', requireAuth, updateBookingTime);
router.post('/:id/review', requireAuth, createReview);

export default router;
