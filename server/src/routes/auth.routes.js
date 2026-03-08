import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  register,
  login,
  logout,
  me,
  verifyEmail,
  resendVerification,
  adminLoginVerify,
  updateProfile,
  changePassword,
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.get('/admin-login-verify', adminLoginVerify);
router.get('/me', requireAuth, me);
router.put('/profile', requireAuth, updateProfile);
router.put('/password', requireAuth, changePassword);

export default router;
