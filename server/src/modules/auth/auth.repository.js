import { prisma } from '../../lib/prisma.js';

export function createRefreshToken({ userId, tokenHash, expiresAt, userAgent }) {
  return prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt, userAgent },
  });
}

export function findRefreshTokenByHash(tokenHash) {
  return prisma.refreshToken.findUnique({ where: { tokenHash } });
}

// เพิกถอนตัวเก่าและสร้างตัวใหม่ใน transaction เดียว
// คืน null ถ้าตัวเก่าถูกเพิกถอนไปก่อนแล้ว (มี request อื่นใช้ token เดียวกันไปพร้อม ๆ กัน)
//
// $transaction(async (tx) => ...) = BEGIN ... COMMIT ถ้าฟังก์ชัน throw จะ ROLLBACK ให้เอง
// ทุก query ข้างในต้องเรียกผ่าน tx ไม่ใช่ prisma ถึงจะอยู่ใน transaction เดียวกัน
export function rotateRefreshToken(oldTokenId, next) {
  return prisma.$transaction(async (tx) => {
    // updateMany คืน { count } = จำนวนแถวที่ถูก UPDATE (affected rows)
    // ใส่ revokedAt: null ใน WHERE เพื่อให้มีแค่ request เดียวที่ชนะ
    const { count } = await tx.refreshToken.updateMany({
      where: { id: oldTokenId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count === 0) return null;

    return tx.refreshToken.create({ data: next });
  });
}

export async function revokeRefreshToken(tokenHash) {
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllRefreshTokens(userId) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
