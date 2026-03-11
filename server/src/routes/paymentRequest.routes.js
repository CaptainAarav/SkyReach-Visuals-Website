import { Router } from 'express';
import { createPaymentRequest } from '../controllers/paymentRequest.controller.js';

const router = Router();
router.post('/', createPaymentRequest);
export default router;
