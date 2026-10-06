import { z } from 'zod';

// v0.1 จดได้แค่ข้อความ ชื่อสถานที่ที่พิมพ์เอง และเวลา (ROADMAP §3)
// รูป คะแนน พิกัด และการเลือก place จากแผนรอ F4 เต็ม

// ว่างหรือ null = ไม่มีค่า
const optionalText = (max, message) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => value || null)
    .nullable()
    .optional();

const body = optionalText(5000, 'ข้อความยาวเกินไป');
const locationLabel = optionalText(150, 'ชื่อสถานที่ยาวเกินไป');
// ISO 8601 พร้อม timezone เก็บเป็น UTC
const occurredAt = z.iso.datetime({ offset: true, message: 'เวลาไม่ถูกต้อง' });

const EMPTY_MESSAGE = 'กรุณาพิมพ์ข้อความหรือชื่อสถานที่อย่างน้อยหนึ่งอย่าง';

export const createEntrySchema = z
  .object({
    // UUID ที่ client สร้างครั้งเดียวต่อการจดหนึ่งครั้ง ส่งซ้ำตอนเน็ตหลุดได้โดยไม่เกิดรายการซ้ำ
    clientId: z.uuid('clientId ต้องเป็น UUID').optional(),
    body,
    locationLabel,
    // ไม่ส่งมา = ตอนนี้
    occurredAt: occurredAt.optional(),
  })
  // ยังไม่มีรูป entry ว่างจึงไม่มีประโยชน์ (API.md §10 ยอมให้ว่างเพื่อรอแนบรูป จะผ่อนเมื่อมี F4.3)
  .refine((entry) => entry.body || entry.locationLabel, { message: EMPTY_MESSAGE, path: ['body'] });

// แก้บางช่อง ส่งเฉพาะช่องที่เปลี่ยน ผลหลังแก้ห้ามว่างทั้งคู่ (ตรวจใน service เพราะต้องดูค่าเดิม)
export const updateEntrySchema = z.object({
  body,
  locationLabel,
  occurredAt: occurredAt.optional(),
});

export const entryParamsSchema = z.object({
  entryId: z.coerce
    .number('ไม่พบบันทึก')
    .int('ไม่พบบันทึก')
    .positive('ไม่พบบันทึก')
    .max(2_147_483_647, 'ไม่พบบันทึก'),
});

export { EMPTY_MESSAGE };
