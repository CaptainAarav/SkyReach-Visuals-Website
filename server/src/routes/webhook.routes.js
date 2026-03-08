import { Router } from 'express';
import express from 'express';
import { handleStripeWebhook } from '../controllers/webhook.controller.js';

const router = Router();

// Raw body parser for Stripe signature verification
router.use(express.raw({ type: 'application/json' }));

router.post('/stripe', handleStripeWebhook);

export default router;
