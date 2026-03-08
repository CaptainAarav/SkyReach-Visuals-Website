import prisma from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import {
  hashPassword,
  comparePassword,
  signToken,
  setCookieToken,
  clearCookieToken,
} from '../services/auth.service.js';

export async function register(req, res, next) {
  // #region agent log
  const _log = (step, data) => { fetch('http://127.0.0.1:7298/ingest/84d36a48-c059-450f-bcf1-32d935b76100',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'22e6a1'},body:JSON.stringify({sessionId:'22e6a1',location:'auth.controller.js:register',message:step,data,timestamp:Date.now()})).catch(()=>{}); };
  // #endregion
  try {
    const { name, email, password } = req.body;
    // #region agent log
    _log('register_entry', { bodyKeys: req.body ? Object.keys(req.body) : [], hasName: !!name, hasEmail: !!email, hasPassword: !!password });
    // #endregion
    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required');
    }
    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters');
    }

    // #region agent log
    _log('register_before_findUnique', {});
    // #endregion
    const existing = await prisma.user.findUnique({ where: { email } });
    // #region agent log
    _log('register_after_findUnique', { existing: !!existing });
    // #endregion
    if (existing) {
      throw new AppError('An account with this email already exists', 409);
    }

    // #region agent log
    _log('register_before_hashPassword', {});
    // #endregion
    const passwordHash = await hashPassword(password);
    // #region agent log
    _log('register_after_hashPassword', {});
    // #endregion
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    // #region agent log
    _log('register_after_create', { userId: user?.id });
    // #endregion

    const token = signToken(user.id);
    setCookieToken(res, token);

    res.status(201).json({ success: true, data: user, error: null });
  } catch (err) {
    // #region agent log
    _log('register_catch', { errName: err?.constructor?.name, errMessage: err?.message, errCode: err?.code, statusCode: err?.statusCode });
    // #endregion
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = signToken(user.id);
    setCookieToken(res, token);

    res.json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  clearCookieToken(res);
  res.json({ success: true, data: null, error: null });
}

export async function me(req, res) {
  res.json({ success: true, data: req.user, error: null });
}

export async function updateProfile(req, res, next) {
  try {
    const { name, email } = req.body;

    if (email && email !== req.user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        throw new AppError('Email is already in use', 409);
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    res.json({ success: true, data: updated, error: null });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required');
    }
    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters');
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) {
      throw new AppError('Current password is incorrect', 401);
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    res.json({ success: true, data: null, error: null });
  } catch (err) {
    next(err);
  }
}
