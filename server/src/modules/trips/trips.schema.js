import { z } from 'zod';

const requiredText = (label, max) =>
  z.string().trim().min(1, `กรุณาใส่${label}`).max(max, `${label}ยาวเกินไป`);

// ช่องที่ไม่บังคับ: ส่งค่าว่างมา = ลบค่าออก (เก็บเป็น NULL)
const optionalText = (label, max) =>
  z
    .string()
    .trim()
    .max(max, `${label}ยาวเกินไป`)
    .transform((value) => value || null)
    .nullable()
    .optional();

const date = z.iso.date('วันที่ไม่ถูกต้อง');

// เงินรับเป็น string เท่านั้น ไม่ผ่าน JS number จะได้ไม่มีเศษทศนิยมเพี้ยน
// ส่ง "" หรือ null = ไม่ตั้งงบ
const budgetAmount = z
  .preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z
      .string('งบต้องเป็นตัวเลข')
      .trim()
      .regex(/^\d{1,10}(\.\d{1,2})?$/, 'งบต้องเป็นตัวเลข ทศนิยมไม่เกิน 2 ตำแหน่ง')
      .nullable(),
  )
  .optional();

const endNotBeforeStart = (trip) =>
  !trip.startDate || !trip.endDate || trip.endDate >= trip.startDate;
const dateRangeIssue = { message: 'วันจบต้องไม่ก่อนวันเริ่ม', path: ['endDate'] };

export const listTripsQuerySchema = z.object({
  status: z.enum(['planning', 'active', 'completed', 'cancelled']).optional(),
});

export const createTripSchema = z
  .object({
    name: requiredText('ชื่อทริป', 150),
    destinationName: requiredText('ปลายทาง', 150),
    originName: optionalText('ต้นทาง', 150),
    description: optionalText('รายละเอียด', 2000),
    startDate: date,
    endDate: date,
    budgetAmount,
    members: z
      .array(z.object({ displayName: requiredText('ชื่อ', 100) }))
      .max(20, 'เพิ่มคนร่วมทริปได้ไม่เกิน 20 คน')
      .default([]),
  })
  .refine(endNotBeforeStart, dateRangeIssue);

export const updateTripSchema = z
  .object({
    name: requiredText('ชื่อทริป', 150),
    destinationName: requiredText('ปลายทาง', 150),
    originName: optionalText('ต้นทาง', 150),
    description: optionalText('รายละเอียด', 2000),
    startDate: date,
    endDate: date,
    budgetAmount,
  })
  .partial()
  .refine(endNotBeforeStart, dateRangeIssue);

export const updateStatusSchema = z.object({
  status: z.enum(['planning', 'active', 'completed', 'cancelled']),
});
