import { AppError } from '../../lib/AppError.js';
import * as categoriesRepository from '../expense-categories/expense-categories.repository.js';
import * as expensesRepository from './expenses.repository.js';

function invalidField(field, message) {
  return new AppError('VALIDATION_ERROR', 422, 'ข้อมูลไม่ถูกต้อง', [{ field, message }]);
}

// คืน { expense, created } ให้ controller เลือก 201 หรือ 200 (API.md §Idempotency)
export async function createExpense(trip, userId, input) {
  const { clientId, categoryId, paidByMemberId, spentAt, ...fields } = input;

  if (clientId) {
    const existing = await expensesRepository.findByClientId(trip.id, clientId);
    if (existing) return { expense: existing, created: false };
  }

  const [category, payer] = await Promise.all([
    categoriesRepository.findActiveCategory(categoryId),
    expensesRepository.findMemberInTrip(trip.id, paidByMemberId),
  ]);
  if (!category) throw invalidField('categoryId', 'ไม่พบหมวดนี้');
  if (!payer) throw invalidField('paidByMemberId', 'คนจ่ายต้องเป็นคนในทริปนี้');

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
  return { expense: existing, created: false };
}

export function listRecentExpenses(trip, { limit }) {
  return expensesRepository.listRecentExpenses(trip.id, limit);
}
