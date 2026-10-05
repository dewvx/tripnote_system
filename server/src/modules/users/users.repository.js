import { Prisma } from '@prisma/client';

import { AppError } from '../../lib/AppError.js';
import { prisma } from '../../lib/prisma.js';

// field ที่ส่งออกนอกระบบได้ ห้ามมี passwordHash
// `select` ของ Prisma = รายชื่อคอลัมน์หลัง SELECT ถ้าไม่ใส่จะได้ทุกคอลัมน์เหมือน SELECT *
const publicUser = { id: true, email: true, displayName: true };

export function findUserById(id) {
  return prisma.user.findUnique({ where: { id }, select: publicUser });
}

// ใช้ตอน login เท่านั้น เพราะต้องได้ passwordHash มาเทียบ
export function findUserWithPasswordByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
    select: { ...publicUser, passwordHash: true },
  });
}

export async function createUser({ email, passwordHash, displayName }) {
  try {
    return await prisma.user.create({
      data: { email, passwordHash, displayName },
      select: publicUser,
    });
  } catch (err) {
    // P2002 = ชน unique constraint (เทียบกับ MySQL error 1062 Duplicate entry)
    // เช็กแบบนี้แทนการ SELECT ก่อน INSERT เพราะกันกรณีสมัครพร้อมกันสองครั้งได้ด้วย
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError('EMAIL_TAKEN', 409, 'อีเมลนี้ถูกใช้สมัครแล้ว', [
        { field: 'email', message: 'อีเมลนี้ถูกใช้สมัครแล้ว' },
      ]);
    }
    throw err;
  }
}
