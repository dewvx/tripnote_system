import { z } from 'zod';

// อ่านและตรวจ environment variable ครั้งเดียวตอนเริ่มแอป
// ถ้าค่าที่จำเป็นหายไป ให้พังทันทีพร้อมข้อความที่อ่านรู้เรื่อง ดีกว่าไปพังกลางทาง
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'ต้องกำหนด DATABASE_URL'),
  CORS_ORIGIN: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`);
  throw new Error(`Environment variables ไม่ถูกต้อง:\n${lines.join('\n')}`);
}

export const env = Object.freeze({
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
});
