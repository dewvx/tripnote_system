import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { tripKeys } from '../trips/hooks.js';
import * as expensesApi from './api.js';

export const expenseKeys = {
  categories: ['expense-categories'],
  // อยู่ใต้ key ของทริป invalidate ทริปแล้วรายการรายจ่ายโหลดใหม่ไปด้วย
  list: (tripId, params = {}) => [...tripKeys.detail(tripId), 'expenses', params],
};

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

export function useCreateExpense(tripId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) => expensesApi.createExpense({ tripId, ...input }),
    onSuccess: () => {
      // ยอดใช้จ่าย งบคงเหลือ และรายการล่าสุดของทริป รวมถึงการ์ดบน Dashboard
      // key ของรายจ่ายอยู่ใต้ tripKeys.detail จึง invalidate ครั้งเดียวได้ทั้งหมด
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(tripId) });
      queryClient.invalidateQueries({ queryKey: tripKeys.list() });
    },
  });
}
