import { z } from 'zod';

// เงินรับเป็น string เท่านั้น ไม่ผ่าน JS number (AGENTS.md §6)
// DB มี CHECK amount > 0 อีกชั้น แต่เช็กที่นี่ก่อนเพื่อตอบ 422 ที่อ่านรู้เรื่อง ไม่ใช่ 500
const amount = z
  .string('กรุณาใส่จำนวนเงิน')
  .trim()
  .regex(/^\d{1,10}(\.\d{1,2})?$/, 'จำนวนเงินต้องเป็นตัวเลข ทศนิยมไม่เกิน 2 ตำแหน่ง')
  .refine((value) => /[1-9]/.test(value), 'จำนวนเงินต้องมากกว่า 0');

const id = (message) =>
  z.coerce.number(message).int(message).positive(message).max(2_147_483_647, message);

export const createExpenseSchema = z.object({
  // UUID ที่ client สร้างครั้งเดียวต่อการกรอกหนึ่งครั้ง ส่งซ้ำได้ตอนเน็ตหลุดโดยไม่เกิดรายการซ้ำ
  clientId: z.uuid('clientId ต้องเป็น UUID').optional(),
  amount,
  categoryId: id('กรุณาเลือกหมวด'),
  paidByMemberId: id('กรุณาเลือกคนจ่าย'),
  description: z
    .string()
    .trim()
    .max(255, 'รายละเอียดยาวเกินไป')
    .transform((value) => value || null)
    .nullable()
    .optional(),
  // ISO 8601 พร้อม timezone เก็บเป็น UTC ไม่ส่งมา = ตอนนี้
  spentAt: z.iso.datetime({ offset: true, message: 'เวลาไม่ถูกต้อง' }).optional(),
});

export const listExpensesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
