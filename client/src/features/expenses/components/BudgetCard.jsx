import { Link } from 'react-router';

import ErrorState from '../../../components/ui/ErrorState.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import { formatMoney } from '../../trips/format.js';
import { useExpenseSummary } from '../hooks.js';
import BudgetBar from './BudgetBar.jsx';

// การ์ดงบบนหน้าทริป ยอดมาจาก summary ตัวเดียวกับหน้าสรุป ตัวเลขทุกจุดจึงตรงกัน
export default function BudgetCard({ trip }) {
  const { data: summary, error, isPending, refetch } = useExpenseSummary(trip.id);

  return (
    <section aria-label="งบประมาณ" className="rounded-2xl bg-paper p-4 ring-1 ring-line">
      {isPending && <Spinner label="กำลังโหลดยอดใช้จ่าย" />}
      {error && <ErrorState message={error.message} onRetry={() => refetch()} />}
      {summary && (
        <>
          <BudgetBar summary={summary} />
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-2">
            <p className="tabular text-sm text-slate">
              เฉลี่ยคนละ {formatMoney(summary.perPerson, summary.currency)}
            </p>
            {summary.expenseCount > 0 && (
              <Link
                to={`/trips/${trip.id}/summary`}
                className="-mr-2 flex min-h-11 items-center rounded-lg px-2 font-medium text-teal active:bg-teal/10"
              >
                ดูสรุป
              </Link>
            )}
          </div>
        </>
      )}
    </section>
  );
}
