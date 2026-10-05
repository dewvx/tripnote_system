import { prisma } from '../../lib/prisma.js';
import { formatDateOnly, parseDateOnly } from '../../utils/datetime.js';
import { formatMoney } from '../../utils/money.js';

// แปลงแถวจาก DB เป็นรูปที่ service ใช้: วันที่เป็น "YYYY-MM-DD", เงินเป็น "0.00"
// service จะได้ไม่ต้องรู้จัก Date ของ DATE หรือ Prisma.Decimal
function toTrip(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    originName: row.originName,
    destinationName: row.destinationName,
    startDate: formatDateOnly(row.startDate),
    endDate: formatDateOnly(row.endDate),
    timezone: row.timezone,
    currency: row.currency,
    budgetAmount: formatMoney(row.budgetAmount),
    status: row.status,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
  };
}

function toMember(row) {
  return { id: row.id, userId: row.userId, displayName: row.displayName, role: row.role };
}

// แปลงค่าจาก service กลับเป็นชนิดที่ Prisma ต้องการ เฉพาะ field ที่ส่งมา
function toTripData(fields) {
  const data = { ...fields };
  if (fields.startDate !== undefined) data.startDate = parseDateOnly(fields.startDate);
  if (fields.endDate !== undefined) data.endDate = parseDateOnly(fields.endDate);
  return data;
}

const membersInOrder = { orderBy: { id: 'asc' } };

// membership ของผู้ใช้ในทริปที่ยังไม่ถูกลบ ใช้ใน requireTripRole
// `trip: { deletedAt: null }` ใน where = JOIN trips แล้วกรอง trips.deleted_at IS NULL
export async function findMembership(tripId, userId) {
  const row = await prisma.tripMember.findFirst({
    where: { tripId, userId, trip: { deletedAt: null } },
    include: { trip: true },
  });
  return row ? { trip: toTrip(row.trip), member: toMember(row) } : null;
}

// ทริปทั้งหมดที่ผู้ใช้เป็นสมาชิก (DATABASE.md §6 "รายการทริปของผู้ใช้")
// `_count` = COUNT(*) ของตารางลูก ในที่นี้คือจำนวนสมาชิกของแต่ละทริป
export async function listTripsForUser(userId, { status } = {}) {
  const rows = await prisma.tripMember.findMany({
    where: { userId, trip: { deletedAt: null, ...(status && { status }) } },
    include: { trip: { include: { _count: { select: { members: true } } } } },
    orderBy: { trip: { startDate: 'desc' } },
  });
  return rows.map((row) => ({
    ...toTrip(row.trip),
    myRole: row.role,
    memberCount: row.trip._count.members,
  }));
}

// ยอดรวมรายจ่ายของหลายทริปในคำสั่งเดียว คืน Map ของ tripId → "0.00"
// `groupBy` = SELECT trip_id, SUM(amount) FROM expenses WHERE trip_id IN (...) AND deleted_at IS NULL
//             GROUP BY trip_id
// ทริปที่ไม่มีรายจ่ายจะไม่มีแถวกลับมา ฝั่งที่เรียกต้องถือว่าเป็น "0.00"
export async function sumExpensesByTrip(tripIds) {
  if (tripIds.length === 0) return new Map();
  const rows = await prisma.expense.groupBy({
    by: ['tripId'],
    where: { tripId: { in: tripIds }, deletedAt: null },
    _sum: { amount: true },
  });
  return new Map(rows.map((row) => [row.tripId, formatMoney(row._sum.amount) ?? '0.00']));
}

// สร้างทริปพร้อมสมาชิกในคำสั่งเดียว
// nested `create` = INSERT trips แล้ว INSERT trip_members ด้วย trip_id ที่ได้ ใน transaction เดียวกัน
export async function createTrip({ createdByUserId, members, ...fields }) {
  const row = await prisma.trip.create({
    data: {
      ...toTripData(fields),
      createdByUserId,
      members: { create: members },
    },
  });
  return row.id;
}

export async function findTripWithMembers(tripId) {
  const row = await prisma.trip.findFirst({
    where: { id: tripId, deletedAt: null },
    include: { members: membersInOrder },
  });
  return row ? { ...toTrip(row), members: row.members.map(toMember) } : null;
}

// ยอดรวมรายจ่ายของทริป = SELECT SUM(amount) ... WHERE trip_id = ? AND deleted_at IS NULL
// ไม่มีรายจ่ายเลย SUM ได้ NULL จึงคืน "0.00"
export async function sumExpenses(tripId) {
  const result = await prisma.expense.aggregate({
    where: { tripId, deletedAt: null },
    _sum: { amount: true },
  });
  return formatMoney(result._sum.amount) ?? '0.00';
}

// soft delete: UPDATE trips SET deleted_at = NOW() ข้อมูลลูกยังอยู่ครบ กู้คืนได้ด้วยมือ
export async function softDeleteTrip(tripId) {
  await prisma.trip.update({ where: { id: tripId }, data: { deletedAt: new Date() } });
}

export async function updateTrip(tripId, fields) {
  await prisma.trip.update({ where: { id: tripId }, data: toTripData(fields) });
}

// จำนวนรายการในแผนที่จะหลุดออกนอกช่วงวันใหม่
export function countItineraryItemsOutside(tripId, startDate, endDate) {
  return prisma.itineraryItem.count({
    where: {
      tripId,
      OR: [
        { dayDate: { lt: parseDateOnly(startDate) } },
        { dayDate: { gt: parseDateOnly(endDate) } },
      ],
    },
  });
}
