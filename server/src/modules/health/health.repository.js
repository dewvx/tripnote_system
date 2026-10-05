import { prisma } from '../../lib/prisma.js';

// Repository คือชั้นเดียวที่แตะ Prisma
export async function pingDatabase() {
  await prisma.$queryRaw`SELECT 1`;
}
