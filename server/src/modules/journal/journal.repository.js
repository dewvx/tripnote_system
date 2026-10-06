import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';

const entrySelect = {
  id: true,
  clientId: true,
  body: true,
  locationLabel: true,
  occurredAt: true,
  createdAt: true,
};

export async function findByClientId(tripId, clientId) {
  return prisma.journalEntry.findFirst({
    where: { tripId, clientId, deletedAt: null },
    select: entrySelect,
  });
}

// คืน null เมื่อชน unique (trip_id, client_id) = คำขอก่อนหน้าด้วย clientId เดียวกันบันทึกไปแล้ว
export async function createEntry(data) {
  try {
    return await prisma.journalEntry.create({ data, select: entrySelect });
  } catch (err) {
    // P2002 = ชน unique constraint (MySQL error 1062 Duplicate entry)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return null;
    throw err;
  }
}

export function findEntry(tripId, entryId) {
  return prisma.journalEntry.findFirst({
    where: { id: entryId, tripId, deletedAt: null },
    select: entrySelect,
  });
}

// UPDATE journal_entries SET ... WHERE id = ? AND trip_id = ? AND deleted_at IS NULL
export async function updateEntry(tripId, entryId, data) {
  const { count } = await prisma.journalEntry.updateMany({
    where: { id: entryId, tripId, deletedAt: null },
    data,
  });
  return count > 0 ? findEntry(tripId, entryId) : null;
}

// soft delete คืน false ถ้าไม่พบหรือถูกลบไปแล้ว รายจ่ายที่ผูกไว้ยังอยู่และกลับไปแสดงเป็นแถวเดี่ยว
export async function softDeleteEntry(tripId, entryId) {
  const { count } = await prisma.journalEntry.updateMany({
    where: { id: entryId, tripId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return count > 0;
}

// บันทึกทั้งหมดของทริปสำหรับ timeline (ทริปหนึ่งมีไม่กี่ร้อยแถว ดึงทั้งหมดได้)
export function listEntries(tripId) {
  return prisma.journalEntry.findMany({
    where: { tripId, deletedAt: null },
    select: entrySelect,
    orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }],
  });
}
