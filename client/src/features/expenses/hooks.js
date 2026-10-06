import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { tripKeys } from '../trips/hooks.js';
import * as expensesApi from './api.js';

export const expenseKeys = {
  categories: ['expense-categories'],
  // อยู่ใต้ key ของทริป invalidate ทริปแล้วรายการรายจ่ายโหลดใหม่ไปด้วย
  list: (tripId, params = {}) => [...tripKeys.detail(tripId), 'expenses', params],
  // แยกจาก list เพราะเป็น infinite query โครงข้อมูลใน cache ไม่เหมือนกัน
  history: (tripId, filters = {}) => [...tripKeys.detail(tripId), 'expense-history', filters],
};

const HISTORY_PAGE_SIZE = 50;

// หมวดเปลี่ยนเฉพาะตอน seed ใหม่ โหลดครั้งเดียวพอ
export function useExpenseCategories() {
  return useQuery({
    queryKey: expenseKeys.categories,
    queryFn: expensesApi.listCategories,
    staleTime: Infinity,
  });
}

export function useRecentExpenses(tripId, limit = 5) {
  return useQuery({
    queryKey: expenseKeys.list(tripId, { limit }),
    queryFn: () => expensesApi.listExpenses(tripId, { limit }),
  });
}

// ประวัติรายจ่ายทีละหน้า filters = { categoryId, paidByMemberId } ค่าไหนไม่มีก็ไม่กรอง
export function useExpenseHistory(tripId, filters) {
  return useInfiniteQuery({
    queryKey: expenseKeys.history(tripId, filters),
    queryFn: ({ pageParam }) =>
      expensesApi.listExpensesPage(tripId, {
        ...filters,
        limit: HISTORY_PAGE_SIZE,
        cursor: pageParam ?? undefined,
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor,
  });
}

// รายจ่ายเปลี่ยนแล้วกระทบยอดใช้จ่าย งบคงเหลือ รายการล่าสุด ประวัติ และการ์ดบน Dashboard
// key ของรายจ่ายทั้งหมดอยู่ใต้ tripKeys.detail จึง invalidate ครั้งเดียวได้ทั้งหมด
function useExpenseMutation(tripId, mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) => mutationFn({ tripId, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
      queryClient.invalidateQueries({ queryKey: tripKeys.list() });
    },
  });
}

export function useCreateExpense(tripId) {
  return useExpenseMutation(tripId, expensesApi.createExpense);
}

export function useUpdateExpense(tripId) {
  return useExpenseMutation(tripId, expensesApi.updateExpense);
}

export function useDeleteExpense(tripId) {
  return useExpenseMutation(tripId, expensesApi.deleteExpense);
}
