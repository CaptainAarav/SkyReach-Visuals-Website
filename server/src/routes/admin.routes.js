import { Router } from 'express';
import { requireAuth, requireAdmin, requireStaff } from '../middleware/auth.js';
import {
  getStats,
  createExternalProject,
  listAccounts,
  getAccount,
  updateAccount,
  deleteAccount,
  resetAccountPassword,
  getAccountOrders,
  getAccountMessages,
  getAccountReviews,
  listOrders,
  updateOrder,
  listMessages,
  markMessageRead,
  markMessageArchived,
  sendMessageToClient,
  listSentMessages,
  listReviews,
  listAdminLogs,
} from '../controllers/admin.controller.js';

const router = Router();

router.use(requireAuth, requireStaff);

// Stats
router.get('/stats', getStats);
router.post('/external-projects', requireAdmin, createExternalProject);

// Accounts
router.get('/accounts', listAccounts);
router.get('/accounts/:id', getAccount);
router.patch('/accounts/:id', updateAccount);
router.delete('/accounts/:id', requireAdmin, deleteAccount);
router.post('/accounts/:id/reset-password', requireAdmin, resetAccountPassword);
router.get('/accounts/:id/orders', getAccountOrders);
router.get('/accounts/:id/messages', getAccountMessages);
router.get('/accounts/:id/reviews', getAccountReviews);

// Orders
router.get('/orders', listOrders);
router.patch('/orders/:id', updateOrder);

// Messages
router.get('/messages', listMessages);
router.patch('/messages/:id', markMessageRead);
router.patch('/messages/:id/archived', markMessageArchived);
router.post('/messages/send', sendMessageToClient);
router.get('/messages/sent', listSentMessages);

// Reviews
router.get('/reviews', listReviews);

// Admin Logs (admin only)
router.get('/logs', requireAdmin, listAdminLogs);

export default router;
