import { Router } from 'express';
import { requireAuth, requireAdmin, requireStaff } from '../middleware/auth.js';
import {
  getStats,
  getTraffic,
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
  deleteOrder,
  listMessages,
  markMessageRead,
  markMessageArchived,
  sendMessageToClient,
  listSentMessages,
  listReviews,
  listAdminLogs,
  getMailInbox,
  getMailSent,
  getMailMessage,
} from '../controllers/admin.controller.js';

const router = Router();

router.use(requireAuth, requireStaff);

// Stats
router.get('/stats', getStats);
router.get('/traffic', getTraffic);
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
router.delete('/orders/:id', deleteOrder);

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

// Live mailbox (IMAP) — same mailbox as SMTP
router.get('/mail/inbox', getMailInbox);
router.get('/mail/sent', getMailSent);
router.get('/mail/messages/:folder/:uid', getMailMessage);

export default router;
