import { env } from '../config/env.js';
import { AppError } from '../lib/AppError.js';

// จุดเดียวที่แปลง error เป็น HTTP response
// Express 5 ส่ง error จาก async handler มาที่นี่ให้เอง ไม่ต้องครอบ try/catch ใน controller
// ต้องรับ argument ครบ 4 ตัว Express ถึงจะรู้ว่าเป็น error handler
export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  // body ที่ parse ไม่ได้ หรือใหญ่เกิน มาจาก express.json()
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'รูปแบบ JSON ไม่ถูกต้อง' },
    });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'ข้อมูลที่ส่งมามีขนาดใหญ่เกินไป' },
    });
  }

  if (!env.isTest) {
    console.error(err);
  }

  // error ที่ไม่ได้คาดไว้: ห้ามส่งรายละเอียดภายในออกไป
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'เกิดข้อผิดพลาดภายในระบบ ลองใหม่อีกครั้ง' },
  });
}
