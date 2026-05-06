import { Router } from 'express';
import { requireAuth, requireAdmin, requireStaff } from '../middleware/auth.js';
import {
  getStats,
  getTraffic,
  resetTraffic,
  updateSiteSettings,
  createExternalProject,
  listAccounts,
  getAccount,
  updateAccount,
  deleteAccount,
  resetAccountPassword,
  getAccountOrders,
  getAccountMessages,
  getAccountReviews,
  listTransactions,
  listOrders,
  getOrderInvoicePreview,
  updateOrder,
  sendDirectOrderInvoice,
  deleteOrder,
  permanentDeleteOrder,
  resetOrderNumberSequence,
  listMessages,
  markMessageRead,
  markMessageArchived,
  deleteMessage,
  sendMessageToClient,
  listSentMessages,
  listReviews,
  updateReviewShowOnMainPage,
  listAdminLogs,
  getMailInbox,
  getMailSent,
  getMailMessage,
  getPeople,
} from '../controllers/admin.controller.js';
import { listPaymentRequests, updatePaymentRequest } from '../controllers/paymentRequest.controller.js';

const router = Router();

router.use(requireAuth, requireStaff);

// Stats
router.get('/stats', getStats);
router.get('/traffic', getTraffic);
router.delete('/traffic', requireAdmin, resetTraffic);
router.patch('/settings', requireAdmin, updateSiteSettings);
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

// Transactions
router.get('/transactions', listTransactions);

// Payment requests (Quick Pay flow)
router.get('/payment-requests', listPaymentRequests);
router.patch('/payment-requests/:id', updatePaymentRequest);

// Orders
router.get('/orders', listOrders);
router.get('/orders/:id/invoice-preview', getOrderInvoicePreview);
router.post('/orders/:id/invoice-preview', getOrderInvoicePreview);
router.post('/orders/:id/send-direct-invoice', sendDirectOrderInvoice);
router.patch('/orders/:id', updateOrder);
router.delete('/orders/:id', deleteOrder);
router.delete('/orders/:id/permanent', permanentDeleteOrder);
router.post('/orders/reset-order-sequence', requireAdmin, resetOrderNumberSequence);

// Messages
router.get('/messages', listMessages);
router.patch('/messages/:id', markMessageRead);
router.patch('/messages/:id/archived', markMessageArchived);
router.delete('/messages/:id', deleteMessage);
router.post('/messages/send', sendMessageToClient);
router.get('/messages/sent', listSentMessages);

// Reviews
router.get('/reviews', listReviews);
router.patch('/reviews/:id', updateReviewShowOnMainPage);

// Admin Logs (admin only)
router.get('/logs', requireAdmin, listAdminLogs);

// Live mailbox (IMAP) — same mailbox as SMTP
router.get('/mail/inbox', getMailInbox);
router.get('/mail/sent', getMailSent);
router.get('/mail/messages/:folder/:uid', getMailMessage);

// People (quote / booking / direct email)
router.get('/people', getPeople);

export default router;
