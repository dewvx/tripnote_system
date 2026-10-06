import Button from '../../../components/ui/Button.jsx';
import { formatMoney } from '../../trips/format.js';
import { expenseTimeFormat } from '../days.js';
import { useDeleteExpense } from '../hooks.js';

// การลบต้องยืนยันและบอกชัดว่าอะไรจะหายไป (หลัก UX ข้อ 7)
export default function DeleteExpenseConfirm({ trip, expense, onCancel, onDeleted }) {
  const deleteExpense = useDeleteExpense(trip.id);
  const when = expenseTimeFormat(trip.timezone).format(new Date(expense.spentAt));

  return (
    <div role="alertdialog" aria-labelledby="delete-expense-title" className="space-y-4">
      <p id="delete-expense-title">
        ลบ <strong>{expense.description || expense.category.nameTh}</strong>{' '}
        <strong className="tabular">{formatMoney(expense.amount, trip.currency)}</strong> ที่{' '}
        {expense.paidBy.displayName} จ่ายเมื่อ {when}?
      </p>
      <p className="text-sm text-slate">ยอดใช้จ่ายและงบคงเหลือของทริปจะลดลงตามไปด้วย</p>

      {deleteExpense.error && (
        <p role="alert" className="text-sm text-danger">
          {deleteExpense.error.message}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button variant="ghost" onClick={onCancel} disabled={deleteExpense.isPending}>
          ยกเลิก
        </Button>
        <Button
          variant="danger"
          loading={deleteExpense.isPending}
          onClick={() => deleteExpense.mutate({ expenseId: expense.id }, { onSuccess: onDeleted })}
        >
          ลบรายจ่าย
        </Button>
      </div>
    </div>
  );
}
