import ErrorState from '../../../components/ui/ErrorState.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import { formatMoney } from '../../trips/format.js';
import { categoryIcon } from '../categoryIcons.js';
import { useRecentExpenses } from '../hooks.js';

// รายจ่ายล่าสุดบนหน้าทริป บันทึกแล้วโผล่ที่นี่ทันที ประวัติเต็มเป็นงานของ F3.2
export default function RecentExpenses({ trip }) {
  const { data: expenses, error, isPending, refetch } = useRecentExpenses(trip.id);
  // เวลาของรายจ่ายแสดงตามเวลาท้องถิ่นของทริป (AGENTS.md §6)
  const timeFormat = new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: trip.timezone,
  });

  return (
    <section className="rounded-2xl bg-paper p-4 ring-1 ring-line">
      <h2 className="font-semibold">รายจ่ายล่าสุด</h2>

      <div className="mt-2">
        {isPending && <Spinner label="กำลังโหลดรายจ่าย" />}
        {error && <ErrorState message={error.message} onRetry={() => refetch()} />}
        {expenses?.length === 0 && (
          <p className="py-2 text-slate">ยังไม่มีรายจ่าย แตะปุ่ม + มุมขวาล่างเพื่อจดรายการแรก</p>
        )}
        {expenses?.length > 0 && (
          <ul className="divide-y divide-line">
            {expenses.map((expense) => (
              <li key={expense.id} className="flex min-h-14 items-center gap-3 py-2">
                <span aria-hidden="true" className="text-2xl">
                  {categoryIcon(expense.category.icon)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate">{expense.description || expense.category.nameTh}</p>
                  <p className="truncate text-sm text-slate">
                    {expense.paidBy.displayName} จ่าย ·{' '}
                    {timeFormat.format(new Date(expense.spentAt))}
                  </p>
                </div>
                <span className="tabular font-semibold">
                  {formatMoney(expense.amount, trip.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
