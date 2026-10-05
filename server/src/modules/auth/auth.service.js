import { createHash, randomBytes } from 'node:crypto';

import bcrypt from 'bcrypt';

import { env } from '../../config/env.js';
import { AppError } from '../../lib/AppError.js';
import { signAccessToken } from '../../lib/jwt.js';
import * as usersRepository from '../users/users.repository.js';
import * as authRepository from './auth.repository.js';

const BCRYPT_COST = 12;

// hash ของรหัสสุ่มที่ไม่มีใครรู้ ใช้เทียบเมื่อไม่พบอีเมล
// ให้เวลาตอบของ "ไม่มีอีเมลนี้" กับ "รหัสผิด" ใกล้เคียงกัน จะได้เดาจากเวลาไม่ได้ว่าอีเมลไหนสมัครไว้
const DUMMY_HASH = '$2b$12$///ahd4mhezUsOH5xn7RFOmJcldh2QNdqB54u5pjsvjzNdfJ.Du.m';

const invalidCredentials = () =>
  new AppError('INVALID_CREDENTIALS', 401, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');

const invalidSession = () => new AppError('UNAUTHENTICATED', 401, 'กรุณาเข้าสู่ระบบอีกครั้ง');

// เก็บใน DB แค่ hash ถ้าฐานข้อมูลหลุด token ที่ได้ไปก็ใช้ไม่ได้
// ใช้ SHA-256 ไม่ใช่ bcrypt เพราะ token เป็นค่าสุ่มยาวอยู่แล้ว เดาไม่ได้ และต้องค้นหาด้วย hash ได้
function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function newRefreshToken(userId, userAgent) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  return {
    token,
    record: { userId, tokenHash: hashToken(token), expiresAt, userAgent },
  };
}

// สิ่งที่ controller ได้กลับไป: ส่ง accessToken + user ใน body, ส่ง refreshToken ใน cookie
function session(user, refresh) {
  return {
    accessToken: signAccessToken(user.id),
    user,
    refreshToken: refresh.token,
    refreshExpiresAt: refresh.record.expiresAt,
  };
}

async function startSession(user, userAgent) {
  const refresh = newRefreshToken(user.id, userAgent);
  await authRepository.createRefreshToken(refresh.record);
  return session(user, refresh);
}

export async function register({ email, password, displayName }, { userAgent } = {}) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const user = await usersRepository.createUser({ email, passwordHash, displayName });
  return startSession(user, userAgent);
}

export async function login({ email, password }, { userAgent } = {}) {
  const found = await usersRepository.findUserWithPasswordByEmail(email);
  const ok = await bcrypt.compare(password, found?.passwordHash ?? DUMMY_HASH);

  if (!found || !ok) throw invalidCredentials();

  const user = { id: found.id, email: found.email, displayName: found.displayName };
  return startSession(user, userAgent);
}

export async function refresh(rawToken, { userAgent } = {}) {
  if (!rawToken) throw invalidSession();

  const stored = await authRepository.findRefreshTokenByHash(hashToken(rawToken));
  if (!stored) throw invalidSession();

  // token ที่ถูกหมุนไปแล้วกลับมาใช้อีก แปลว่าอาจถูกขโมย
  // เพิกถอนทุกเซสชันของผู้ใช้นี้ ทั้งคนร้ายและเจ้าของต้อง login ใหม่
  if (stored.revokedAt) {
    await authRepository.revokeAllRefreshTokens(stored.userId);
    throw invalidSession();
  }

  if (stored.expiresAt <= new Date()) throw invalidSession();

  const user = await usersRepository.findUserById(stored.userId);
  if (!user) throw invalidSession();

  const next = newRefreshToken(user.id, userAgent);
  const rotated = await authRepository.rotateRefreshToken(stored.id, next.record);

  // แพ้ race กับ request อื่นที่ใช้ token ตัวเดียวกันในเสี้ยววินาทีเดียวกัน
  // ไม่ถือว่าโดนขโมย แค่ไม่ออก token ให้ request นี้
  if (!rotated) throw invalidSession();

  return session(user, next);
}

export async function logout(rawToken) {
  if (!rawToken) return;
  await authRepository.revokeRefreshToken(hashToken(rawToken));
}
