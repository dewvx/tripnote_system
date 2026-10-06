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

// รายจ่ายล่าสุดของทริป = SELECT ... WHERE trip_id = ? AND deleted_at IS NULL
//                        ORDER BY spent_at DESC, id DESC LIMIT ?
export async function listRecentExpenses(tripId, limit) {
  const rows = await prisma.expense.findMany({
    where: { tripId, deletedAt: null },
    include: expenseInclude,
    orderBy: [{ spentAt: 'desc' }, { id: 'desc' }],
    take: limit,
  });
  return rows.map(toExpense);
}
