import { env } from '../../config/env.js';
import * as authService from './auth.service.js';

const REFRESH_COOKIE = 'refresh_token';

// cookie ถูกส่งกลับมาเฉพาะ request ที่ขึ้นต้นด้วย /api/auth เท่านั้น ไม่ติดไปกับทุก request
// SameSite=Lax กันเว็บอื่น POST มาพร้อม cookie นี้ (CSRF)
const cookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax',
  path: '/api/auth',
};

function meta(req) {
  return { userAgent: req.get('user-agent')?.slice(0, 255) };
}

function sendSession(res, status, { accessToken, user, refreshToken, refreshExpiresAt }) {
  res.cookie(REFRESH_COOKIE, refreshToken, { ...cookieOptions, expires: refreshExpiresAt });
  res.status(status).json({ data: { accessToken, user } });
}

export async function register(req, res) {
  const result = await authService.register(req.valid.body, meta(req));
  sendSession(res, 201, result);
}

export async function login(req, res) {
  const result = await authService.login(req.valid.body, meta(req));
  sendSession(res, 200, result);
}

export async function refresh(req, res) {
  const result = await authService.refresh(req.cookies[REFRESH_COOKIE], meta(req));
  sendSession(res, 200, result);
}

export async function logout(req, res) {
  await authService.logout(req.cookies[REFRESH_COOKIE]);
  res.clearCookie(REFRESH_COOKIE, cookieOptions);
  res.status(204).end();
}
