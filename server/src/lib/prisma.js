import { PrismaClient } from '@prisma/client';

import { env } from '../config/env.js';

// PrismaClient ต้องมีตัวเดียวต่อ process
// เก็บไว้บน globalThis กันการสร้างซ้ำตอน --watch รีโหลดไฟล์ และตอน function instance ถูกใช้ซ้ำ
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    log: env.isProduction ? ['error'] : ['warn', 'error'],
  });

if (!env.isProduction) {
  globalForPrisma.__prisma = prisma;
}
