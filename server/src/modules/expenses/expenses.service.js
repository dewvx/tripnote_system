import { Prisma } from '@prisma/client';

import { AppError } from '../../lib/AppError.js';
import { dayKeyFormatter } from '../../utils/datetime.js';
import { formatMoney } from '../../utils/money.js';
import * as categoriesRepository from '../expense-categories/expense-categories.repository.js';
import * as expensesRepository from './expenses.repository.js';
import { settle, splitEqually } from './expenses.settlement.js';

function invalidField(field, message) {
  return new AppError('VALIDATION_ERROR', 422, 'ข้อมูลไม่ถูกต้อง', [{ field, message }]);
}

function notFound() {
  return new AppError('EXPENSE_NOT_FOUND', 404, 'ไม่พบรายการค่าใช้จ่ายนี้ อาจถูกลบไปแล้ว');
}

// หมวดกับคนจ่ายต้องมีจริงและคนจ่ายต้องอยู่ในทริปนี้ ตรวจเฉพาะช่องที่ส่งมา
async function assertReferences(tripId, { categoryId, paidByMemberId }) {
  const [category, payer] = await Promise.all([
    categoryId === undefined ? true : categoriesRepository.findActiveCategory(categoryId),
    paidByMemberId === undefined
      ? true
      : expensesRepository.findMemberInTrip(tripId, paidByMemberId),
  ]);
  if (!category) throw invalidField('categoryId', 'ไม่พบหมวดนี้');
  if (!payer) throw invalidField('paidByMemberId', 'คนจ่ายต้องเป็นคนในทริปนี้');
}

// คืน { expense, created } ให้ controller เลือก 201 หรือ 200 (API.md §Idempotency)
export async function createExpense(trip, userId, input) {
  const { clientId, categoryId, paidByMemberId, spentAt, ...fields } = input;

  if (clientId) {
    const existing = await expensesRepository.findByClientId(trip.id, clientId);
    if (existing) return { expense: existing, created: false };
  }

  await assertReferences(trip.id, { categoryId, paidByMemberId });

  const expense = await expensesRepository.createExpense({
    ...fields,
    tripId: trip.id,
    categoryId,
    paidByMemberId,
    createdByUserId: userId,
    clientId: clientId ?? null,
    spentAt: spentAt ? new Date(spentAt) : new Date(),
  });
  if (expense) return { expense, created: true };

  // ชน unique ระหว่างทาง: คำขอก่อนหน้าด้วย clientId เดียวกันบันทึกไปแล้ว คืนตัวนั้นแทน
  const existing = await expensesRepository.findByClientId(trip.id, clientId);
  // หาไม่เจอแปลว่ารายการเดิมถูกลบไปแล้ว (unique ยังนับแถวที่ soft delete) ไม่สร้างกลับมาใหม่
  if (!existing) throw notFound();
  return { expense: existing, created: false };
}

// ยอดรวมรายวันของทุกรายการที่ตรงตัวกรอง ไม่ใช่แค่หน้าที่โหลดมา ใหม่ไปเก่า
// รวมด้วย Prisma.Decimal ไม่ผ่าน JS number (AGENTS.md §6)
export function sumByDay(rows, timezone) {
  const toDay = dayKeyFormatter(timezone);
  const days = new Map();
  for (const { spentAt, amount } of rows) {
    const date = toDay(spentAt);
    const day = days.get(date) ?? { date, total: new Prisma.Decimal(0), count: 0 };
    day.total = day.total.plus(amount);
    day.count += 1;
    days.set(date, day);
  }
  return [...days.values()]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((day) => ({ ...day, total: formatMoney(day.total) }));
}

// คืน { expenses, meta } meta.days คือยอดรายวันของทั้งชุดที่กรอง ใช้แสดงหัวกลุ่มวัน
export async function listExpenses(trip, { limit, cursor, ...filters }) {
  // ขอเกินมาหนึ่งแถวเพื่อรู้ว่ามีหน้าถัดไปไหม
  const [rows, amounts] = await Promise.all([
    expensesRepository.listExpenses(trip.id, { ...filters, cursor, limit: limit + 1 }),
    expensesRepository.listAmountsForDays(trip.id, filters),
  ]);
  const hasMore = rows.length > limit;
  const expenses = hasMore ? rows.slice(0, limit) : rows;
  return {
    expenses,
    meta: {
      nextCursor: hasMore ? String(expenses.at(-1).id) : null,
      days: sumByDay(amounts, trip.timezone),
    },
  };
}

// เปอร์เซ็นต์ทศนิยมหนึ่งตำแหน่งเป็น number ไว้แสดงผล ไม่ใช่เงินจึงไม่ต้องเป็น string
// ตัวหารเป็นศูนย์คืน null (งบ 0 หรือยังไม่มีรายจ่าย)
function percentOf(part, whole) {
  const divisor = new Prisma.Decimal(whole);
  if (divisor.isZero()) return null;
  return new Prisma.Decimal(part).div(divisor).times(100).toDecimalPlaces(1).toNumber();
}

// สรุปงบ (F3.3) และยอดเคลียร์ (F3.4) คำนวณตอนอ่านทุกครั้ง ไม่มีตารางเก็บยอดรวม (AGENTS.md §5)
export async function getSummary(trip) {
  const [{ total, count }, categoryTotals, amounts, paidByMember] = await Promise.all([
    expensesRepository.sumTrip(trip.id),
    expensesRepository.sumByCategory(trip.id),
    expensesRepository.listAmountsForDays(trip.id, {}),
    expensesRepository.sumPaidByMember(trip.id),
  ]);
  const memberCount = paidByMember.length;
  const byMember = splitEqually(paidByMember, total);
  const categories = await categoriesRepository.findCategoriesByIds(
    categoryTotals.map((c) => c.categoryId),
  );
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const budget = trip.budgetAmount;

  return {
    currency: trip.currency,
    budgetAmount: budget,
    totalSpent: formatMoney(total),
    remaining: budget === null ? null : formatMoney(new Prisma.Decimal(budget).minus(total)),
    budgetUsedPercent: budget === null ? null : percentOf(total, budget),
    expenseCount: count,
    memberCount,
    // หารแล้วปัดเป็นสตางค์ (ROUND_HALF_UP) เป็นค่าประมาณไว้ดู การหารให้ลงตัวทุกสตางค์เป็นงานของ settlement
    perPerson: memberCount === 0 ? null : formatMoney(total.div(memberCount)),
    byCategory: categoryTotals
      .map(({ categoryId, total: categoryTotal, count: categoryCount }) => {
        const category = categoryById.get(categoryId);
        return {
          categoryId,
          code: category?.code ?? null,
          name: category?.nameTh ?? null,
          icon: category?.icon ?? null,
          total: formatMoney(categoryTotal),
          count: categoryCount,
          percent: percentOf(categoryTotal, total),
        };
      })
      .sort((a, b) => new Prisma.Decimal(b.total).comparedTo(a.total)),
    // เรียงจากวันแรกไปวันล่าสุด อ่านเป็นลำดับการเดินทาง
    byDay: sumByDay(amounts, trip.timezone).reverse(),
    byMember,
    settlements: settle(byMember),
  };
}

export async function updateExpense(trip, expenseId, input) {
  await assertReferences(trip.id, input);

  const { spentAt, ...fields } = input;
  const data = { ...fields, ...(spentAt && { spentAt: new Date(spentAt) }) };
  // ไม่มีช่องให้แก้ ไม่ต้องสั่ง UPDATE แค่คืนรายการเดิม
  const expense =
    Object.keys(data).length === 0
      ? await expensesRepository.findExpense(trip.id, expenseId)
      : await expensesRepository.updateExpense(trip.id, expenseId, data);
  if (!expense) throw notFound();
  return expense;
}

export async function deleteExpense(trip, expenseId) {
  const deleted = await expensesRepository.softDeleteExpense(trip.id, expenseId);
  if (!deleted) throw notFound();
}
