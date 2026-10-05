import { z } from 'zod';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('อีเมลไม่ถูกต้อง').max(255, 'อีเมลยาวเกินไป'));

// bcrypt ใช้แค่ 72 byte แรก ภาษาไทย 1 ตัวอักษร = 3 byte จึงนับเป็น byte ไม่ใช่จำนวนตัวอักษร
const newPassword = z
  .string()
  .min(8, 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'รหัสผ่านยาวเกินไป');

export const registerSchema = z.object({
  email,
  password: newPassword,
  displayName: z.string().trim().min(1, 'กรุณาใส่ชื่อที่แสดง').max(100, 'ชื่อยาวเกินไป'),
});

// ตอน login ไม่ตรวจกฎรหัสผ่าน จะได้ไม่บอกใบ้ว่ารหัสแบบไหนเป็นไปไม่ได้
export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'กรุณาใส่รหัสผ่าน').max(200),
});
