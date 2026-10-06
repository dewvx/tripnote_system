import { useState } from 'react';
import { Link } from 'react-router';

import ErrorState from '../../../components/ui/ErrorState.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import { expenseTimeFormat } from '../days.js';
import { useRecentExpenses } from '../hooks.js';
import EditExpenseSheet from './EditExpenseSheet.jsx';
import ExpenseRow from './ExpenseRow.jsx';

// รายจ่ายล่าสุดบนหน้าทริป บันทึกแล้วโผล่ที่นี่ทันที ประวัติเต็มอยู่หน้า /expenses (F3.2)
export default function RecentExpenses({ trip, canEdit }) {
  const { data: expenses, error, isPending, refetch } = useRecentExpenses(trip.id);
  const [editing, setEditing] = useState(null);
  const timeFormat = expenseTimeFormat(trip.timezone);

  return (
    <section className="rounded-2xl bg-paper p-4 ring-1 ring-line">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">รายจ่ายล่าสุด</h2>
        {expenses?.length > 0 && (
          <Link
            to={`/trips/${trip.id}/expenses`}
            className="-mr-2 flex min-h-11 items-center rounded-lg px-2 font-medium text-teal active:bg-teal/10"
          >
            ดูทั้งหมด
          </Link>
        )}
      </div>

      <div className="mt-1">
        {isPending && <Spinner label="กำลังโหลดรายจ่าย" />}
        {error && <ErrorState message={error.message} onRetry={() => refetch()} />}
        {expenses?.length === 0 && (
          <p className="py-2 text-slate">ยังไม่มีรายจ่าย แตะปุ่ม + มุมขวาล่างเพื่อจดรายการแรก</p>
        )}
        {expenses?.length > 0 && (
          <ul className="divide-y divide-line">
            {expenses.map((expense) => (
              <li key={expense.id}>
                <ExpenseRow
                  expense={expense}
                  currency={trip.currency}
                  timeFormat={timeFormat}
                  onSelect={canEdit ? setEditing : undefined}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {canEdit && (
        <EditExpenseSheet trip={trip} expense={editing} onClose={() => setEditing(null)} />
      )}
    </section>
  );
}
