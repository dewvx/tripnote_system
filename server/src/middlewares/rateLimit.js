import { MemoryStore, rateLimit } from 'express-rate-limit';

import { AppError } from '../lib/AppError.js';

// ตัวนับเก็บใน memory ของแต่ละ instance บน Vercel จึงนับแยกกัน ไม่แม่นยำ
// รับได้ตอนใช้กันเองไม่กี่คน ต้องย้ายไปใช้ store ภายนอกก่อนเปิดให้คนอื่นใช้ (ARCHITECTURE.md §6)
const stores = [];

function limiter({ windowMs, limit }) {
  const store = new MemoryStore();
  stores.push(store);

  return rateLimit({
    windowMs,
    limit,
    store,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new AppError('RATE_LIMITED', 429, 'ลองบ่อยเกินไป รอสักครู่แล้วลองใหม่'));
    },
  });
}

// สำหรับ login / register: 10 ครั้งต่อ 15 นาทีต่อ IP พอให้พิมพ์ผิดได้บ้าง แต่เดารหัสผ่านไม่ไหว
export const authLimiter = limiter({ windowMs: 15 * 60 * 1000, limit: 10 });

// refresh / logout ถูกเรียกเองอัตโนมัติตอนเปิดแอปหรือ token หมดอายุ จึงผ่อนให้มากกว่า
export const sessionLimiter = limiter({ windowMs: 15 * 60 * 1000, limit: 60 });

// ใช้ใน test เท่านั้น เพื่อให้แต่ละ test เริ่มนับจากศูนย์
export function resetRateLimits() {
  for (const store of stores) store.resetAll();
}
