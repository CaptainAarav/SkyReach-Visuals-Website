import prisma from '../config/db.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { signToken, setCookieToken } from '../services/auth.service.js';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { logAdminAction } from './admin.controller.js';

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 min
const authChallenges = new Map(); // email -> { challenge, createdAt }
const regChallenges = new Map(); // userId -> { options, createdAt }

function getRpId() {
  try {
    const u = new URL(env.clientUrl);
    return u.hostname || 'localhost';
  } catch {
    return 'localhost';
  }
}

function getOrigin() {
  try {
    const u = new URL(env.clientUrl);
    return u.origin;
  } catch {
    return 'http://localhost:5173';
  }
}

function purgeOldChallenges(map) {
  const now = Date.now();
  for (const [k, v] of map.entries()) {
    if (now - v.createdAt > CHALLENGE_TTL_MS) map.delete(k);
  }
}

export async function passkeyAuthOptions(req, res, next) {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      throw new AppError('Email is required', 400);
    }
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { passkeyCredentials: true },
    });
    if (!user || user.passkeyCredentials.length === 0) {
      throw new AppError('No passkey found for this email. Sign in with password or add a passkey in Settings.', 400);
    }
    if (user.status !== 'ACTIVE') {
      throw new AppError('Account is not active', 403);
    }
    if (!user.emailVerified) {
      throw new AppError('Please verify your email before signing in.', 403);
    }
    purgeOldChallenges(authChallenges);
    const rpID = getRpId();
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.passkeyCredentials.map((c) => ({ id: c.credentialId })),
      userVerification: 'preferred',
    });
    authChallenges.set(email.trim().toLowerCase(), { challenge: options.challenge, createdAt: Date.now() });
    res.json({ success: true, data: options, error: null });
  } catch (err) {
    next(err);
  }
}

export async function passkeyAuth(req, res, next) {
  try {
    const { email, response: responseJson, rememberMe } = req.body;
    if (!email || !responseJson) {
      throw new AppError('Email and passkey response are required', 400);
    }
    const key = email.trim().toLowerCase();
    const stored = authChallenges.get(key);
    if (!stored) {
      throw new AppError('Passkey session expired. Please try again.', 400);
    }
    authChallenges.delete(key);
    const user = await prisma.user.findUnique({
      where: { email: key },
      include: { passkeyCredentials: true },
    });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }
    const cred = user.passkeyCredentials.find((c) => c.credentialId === responseJson.id);
    if (!cred) {
      throw new AppError('Invalid passkey', 401);
    }
    let transports;
    try {
      transports = cred.transports ? JSON.parse(cred.transports) : undefined;
    } catch {
      transports = undefined;
    }
    const credential = {
      id: cred.credentialId,
      publicKey: new Uint8Array(cred.publicKey),
      counter: cred.counter,
      transports,
    };
    const verification = await verifyAuthenticationResponse({
      response: responseJson,
      expectedChallenge: stored.challenge,
      expectedOrigin: getOrigin(),
      expectedRPID: getRpId(),
      credential,
    });
    if (!verification.verified) {
      throw new AppError('Passkey verification failed', 401);
    }
    await prisma.passkeyCredential.update({
      where: { id: cred.id },
      data: { counter: verification.authenticationInfo.newCounter },
    });
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip },
    });
    const token = signToken(user.id);
    setCookieToken(res, token, { rememberMe: rememberMe !== false });
    await logAdminAction(user.id, 'PASSKEY_LOGIN', null, `Passkey login: ${user.name} (${user.email}) from ${ip}`).catch(() => {});
    res.json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function passkeyRegisterOptions(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { passkeyCredentials: true },
    });
    if (!user) {
      throw new AppError('User not found', 404);
    }
    purgeOldChallenges(regChallenges);
    const rpID = getRpId();
    const options = await generateRegistrationOptions({
      rpName: 'SkyReach Visuals',
      rpID,
      userName: user.email,
      userID: new TextEncoder().encode(userId),
      userDisplayName: user.name,
      attestationType: 'none',
      excludeCredentials: user.passkeyCredentials.map((c) => ({ id: c.credentialId })),
      supportedAlgorithmIDs: [-7, -257],
    });
    regChallenges.set(userId, { options, createdAt: Date.now() });
    res.json({ success: true, data: options, error: null });
  } catch (err) {
    next(err);
  }
}

export async function passkeyRegister(req, res, next) {
  try {
    const userId = req.user.id;
    const stored = regChallenges.get(userId);
    if (!stored) {
      throw new AppError('Registration session expired. Please try again.', 400);
    }
    regChallenges.delete(userId);
    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge: stored.options.challenge,
      expectedOrigin: getOrigin(),
      expectedRPID: getRpId(),
    });
    if (!verification.verified || !verification.registrationInfo) {
      throw new AppError('Passkey registration failed', 400);
    }
    const { credential, credentialDeviceType } = verification.registrationInfo;
    const transportsJson = credential.transports?.length ? JSON.stringify(credential.transports) : null;
    await prisma.passkeyCredential.create({
      data: {
        userId,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        deviceType: credentialDeviceType,
        transports: transportsJson,
      },
    });
    await logAdminAction(userId, 'PASSKEY_REGISTER', null, 'Passkey added').catch(() => {});
    res.json({ success: true, data: { message: 'Passkey added successfully' }, error: null });
  } catch (err) {
    next(err);
  }
}
