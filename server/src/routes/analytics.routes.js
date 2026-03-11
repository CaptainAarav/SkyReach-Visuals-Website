import { Router } from 'express';
import prisma from '../config/db.js';

const router = Router();

/** Record a page view (public, no auth). Called by client on each load. */
router.post('/view', async (req, res) => {
  try {
    const path = req.body?.path ?? null;
    await prisma.pageView.create({ data: { path } });
    res.json({ success: true, data: null, error: null });
  } catch (err) {
    res.json({ success: true, data: null, error: null });
  }
});

export default router;
