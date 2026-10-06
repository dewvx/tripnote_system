import { Link, useParams } from 'react-router';

import BackLink from '../components/ui/BackLink.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import BudgetBar from '../features/expenses/components/BudgetBar.jsx';
import {
  CategoryBreakdown,
  DailyTotals,
} from '../features/expenses/components/SpendingBreakdown.jsx';
import { useExpenseSummary } from '../features/expenses/hooks.js';
import TripNotFound from '../features/trips/components/TripNotFound.jsx';
import { formatMoney } from '../features/trips/format.js';
import { useTrip } from '../features/trips/hooks.js';

function Card({ title, children }) {
  return (
    <section className="rounded-2xl bg-paper p-4 ring-1 ring-line">
      {title && <h2 className="mb-1 font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

// สรุปค่าใช้จ่าย (FEATURES.md F3.3): แถบงบ เฉลี่ยต่อคน สัดส่วนตามหมวด ยอดรายวัน
export default function ExpenseSummaryPage() {
  const { tripId } = useParams();
  const trip = useTrip(tripId);
  const summary = useExpenseSummary(tripId);

  if (trip.isPending || summary.isPending) return <Spinner label="กำลังโหลดสรุป" />;
  const error = trip.error ?? summary.error;
  if (error?.code === 'TRIP_NOT_FOUND') return <TripNotFound />;
  if (error) {
    return (
      <ErrorState
        message={error.message}
        onRetry={() => (trip.error ? trip.refetch() : summary.refetch())}
      />
    );
  }

  const data = summary.data;

  return (
    <section className="space-y-4 pt-2">
      <div>
        <BackLink to={`/trips/${tripId}`}>{trip.data.name}</BackLink>
        <h1 className="mt-1 text-2xl font-bold">สรุปค่าใช้จ่าย</h1>
      </div>

      <Card>
        <BudgetBar summary={data} />
      </Card>

      <Card>
        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-sm text-slate">เฉลี่ยต่อคน ({data.memberCount} คน)</dt>
            <dd className="tabular text-lg font-semibold">
              {formatMoney(data.perPerson, data.currency)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate">จำนวนรายการ</dt>
            <dd className="tabular text-lg font-semibold">{data.expenseCount}</dd>
          </div>
        </dl>
      </Card>

      {data.expenseCount === 0 ? (
        <Card>
          <p className="text-slate">ยังไม่มีรายจ่าย จดรายการแรกได้จากหน้าทริป</p>
          <Link
            to={`/trips/${tripId}`}
            className="mt-1 inline-flex min-h-11 items-center font-medium text-teal"
          >
            กลับไปหน้าทริป
          </Link>
        </Card>
      ) : (
        <>
          <Card title="ตามหมวด">
            <CategoryBreakdown summary={data} />
          </Card>
          <Card title="รายวัน">
            <DailyTotals summary={data} trip={trip.data} />
          </Card>
          <Link
            to={`/trips/${tripId}/expenses`}
            className="flex min-h-11 items-center justify-center rounded-lg font-medium text-teal ring-1 ring-line active:bg-teal/10"
          >
            ดูรายจ่ายทุกรายการ
          </Link>
        </>
      )}
    </section>
  );
}
