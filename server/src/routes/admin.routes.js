import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  listOrders,
  updateOrderStatus,
  listAccounts,
  updateAccount,
  listMessages,
  markMessageRead,
  listReviews,
} from '../controllers/admin.controller.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/orders', listOrders);
router.patch('/orders/:id', updateOrderStatus);
router.get('/accounts', listAccounts);
router.patch('/accounts/:id', updateAccount);
router.get('/messages', listMessages);
router.patch('/messages/:id', markMessageRead);
router.get('/reviews', listReviews);

export default router;
