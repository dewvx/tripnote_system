import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';
import { formatMoney } from '../../utils/money.js';

// `include` ที่เลือกแค่บาง field = LEFT JOIN ตารางที่เกี่ยวข้องแล้ว SELECT เฉพาะคอลัมน์ที่ระบุ
const expenseInclude = {
  category: { select: { id: true, code: true, nameTh: true, icon: true, color: true } },
  paidBy: { select: { id: true, displayName: true } },
};

function toExpense(row) {
  return {
    id: row.id,
    clientId: row.clientId,
    amount: formatMoney(row.amount),
    description: row.description,
    spentAt: row.spentAt,
    category: row.category,
    paidBy: row.paidBy,
    createdAt: row.createdAt,
  };
}

// สมาชิกของทริปนี้เท่านั้น กันการส่ง memberId ของทริปอื่นมา
export function findMemberInTrip(tripId, memberId) {
  return prisma.tripMember.findFirst({ where: { id: memberId, tripId }, select: { id: true } });
}

export async function findByClientId(tripId, clientId) {
  const row = await prisma.expense.findFirst({
    where: { tripId, clientId, deletedAt: null },
    include: expenseInclude,
  });
  return row ? toExpense(row) : null;
}

// คืน null เมื่อชน unique (trip_id, client_id) = คำขอก่อนหน้าด้วย clientId เดียวกันบันทึกไปแล้ว
// (กดบันทึกซ้ำตอนเน็ตช้า คำขอแรกไปถึงแล้วแต่คำตอบยังไม่กลับ)
export async function createExpense(data) {
  try {
    const row = await prisma.expense.create({ data, include: expenseInclude });
    return toExpense(row);
  } catch (err) {
    // P2002 = ชน unique constraint (MySQL error 1062 Duplicate entry)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return null;
    throw err;
  }
}

function listWhere(tripId, { categoryId, paidByMemberId }) {
  return {
    tripId,
    deletedAt: null,
    ...(categoryId && { categoryId }),
    ...(paidByMemberId && { paidByMemberId }),
  };
}

// รายจ่ายของทริป ใหม่ไปเก่า = SELECT ... WHERE trip_id = ? AND deleted_at IS NULL [AND category_id = ?]
//                              ORDER BY spent_at DESC, id DESC LIMIT ?
// `cursor` + `skip: 1` = เริ่มต่อจากแถว id นั้นตามลำดับ orderBy โดยไม่รวมตัวมันเอง
// เทียบกับ SQL คือ AND (spent_at, id) < (spent_at ของแถวนั้น, id ของแถวนั้น) ไม่ใช้ OFFSET
// รายการใหม่ที่เพิ่มระหว่างเลื่อนดูจึงไม่ทำให้หน้าถัดไปซ้ำหรือข้าม
export async function listExpenses(tripId, { cursor, limit, ...filters }) {
  const rows = await prisma.expense.findMany({
    where: listWhere(tripId, filters),
    include: expenseInclude,
    orderBy: [{ spentAt: 'desc' }, { id: 'desc' }],
    take: limit,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });
  return rows.map(toExpense);
}

// เวลากับจำนวนเงินของทุกรายการที่ตรงตัวกรอง ไว้รวมยอดรายวันใน service
// ไม่ GROUP BY DATE() ใน SQL เพราะต้องแปลงเป็นวันตาม timezone ของทริป
// และ CONVERT_TZ ด้วยชื่อโซนต้องโหลดตาราง timezone ใน MySQL ซึ่ง managed MySQL มักไม่มี
export function listAmountsForDays(tripId, filters) {
  return prisma.expense.findMany({
    where: listWhere(tripId, filters),
    select: { spentAt: true, amount: true },
  });
}

export async function findExpense(tripId, expenseId) {
  const row = await prisma.expense.findFirst({
    where: { id: expenseId, tripId, deletedAt: null },
    include: expenseInclude,
  });
  return row ? toExpense(row) : null;
}

// `updateMany` = UPDATE expenses SET ... WHERE id = ? AND trip_id = ? AND deleted_at IS NULL
// ใช้แทน `update` เพราะ where มี trip_id กำกับได้ และคืนจำนวนแถวที่แก้ (0 = ไม่พบ) แทนการ throw
export async function updateExpense(tripId, expenseId, data) {
  const { count } = await prisma.expense.updateMany({
    where: { id: expenseId, tripId, deletedAt: null },
    data,
  });
  return count > 0 ? findExpense(tripId, expenseId) : null;
}

// soft delete: UPDATE expenses SET deleted_at = NOW() คืน false ถ้าไม่พบหรือถูกลบไปแล้ว
export async function softDeleteExpense(tripId, expenseId) {
  const { count } = await prisma.expense.updateMany({
    where: { id: expenseId, tripId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return count > 0;
}
