import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

// access token อายุสั้น เก็บแค่ user id ไว้ใน `sub`
// ข้อมูลอื่นของผู้ใช้ให้ดึงจาก DB เมื่อจำเป็น จะได้ไม่ค้างค่าเก่าอยู่ใน token
export function signAccessToken(userId) {
  return jwt.sign({}, env.JWT_ACCESS_SECRET, {
    subject: String(userId),
    expiresIn: env.JWT_ACCESS_TTL,
    algorithm: 'HS256',
  });
}

// คืน { userId } ถ้า token ใช้ได้
// throw jwt.TokenExpiredError เมื่อหมดอายุ และ jwt.JsonWebTokenError เมื่อ token ผิดรูปแบบหรือลายเซ็นผิด
export function verifyAccessToken(token) {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
  return { userId: Number(payload.sub) };
}

export const { TokenExpiredError } = jwt;
