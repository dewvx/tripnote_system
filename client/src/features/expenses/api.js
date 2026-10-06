import { api } from '../../lib/axios.js';

export async function listCategories() {
  const { data } = await api.get('/expense-categories');
  return data.data;
}

export async function listExpenses(tripId, params) {
  const { data } = await api.get(`/trips/${tripId}/expenses`, { params });
  return data.data;
}

// หนึ่งหน้าของประวัติ คืน { data, meta: { nextCursor, days } }
export async function listExpensesPage(tripId, params) {
  const { data } = await api.get(`/trips/${tripId}/expenses`, { params });
  return data;
}

// ส่ง clientId เดิมซ้ำได้อย่างปลอดภัย server คืนรายการเดิมแทนการสร้างใหม่
export async function createExpense({ tripId, ...input }) {
  const { data } = await api.post(`/trips/${tripId}/expenses`, input);
  return data.data;
}

export async function updateExpense({ tripId, expenseId, ...input }) {
  const { data } = await api.patch(`/trips/${tripId}/expenses/${expenseId}`, input);
  return data.data;
}

export async function deleteExpense({ tripId, expenseId }) {
  await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
}
