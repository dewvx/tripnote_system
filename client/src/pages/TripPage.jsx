import { Link, useParams } from 'react-router';

import BackLink from '../components/ui/BackLink.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import QuickAddExpense from '../features/expenses/components/QuickAddExpense.jsx';
import RecentExpenses from '../features/expenses/components/RecentExpenses.jsx';
import TripNotFound from '../features/trips/components/TripNotFound.jsx';
import TripStatusActions from '../features/trips/components/TripStatusActions.jsx';
import TripStatusBadge from '../features/trips/components/TripStatusBadge.jsx';
import { formatDateRange, formatMoney } from '../features/trips/format.js';
import { useTrip } from '../features/trips/hooks.js';

// ภาพรวมทริป Trip Mode และแท็บด้านล่างจะมาใน feature ถัดไป
export default function TripPage() {
  const { tripId } = useParams();
  const { data: trip, error, isPending, refetch } = useTrip(tripId);

  if (isPending) return <Spinner label="กำลังโหลดทริป" />;
  if (error?.code === 'TRIP_NOT_FOUND') return <TripNotFound />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  const isOwner = trip.myRole === 'owner';
  const canEdit = isOwner || trip.myRole === 'editor';
  const overBudget = trip.remaining?.startsWith('-');

  return (
    <section className={`space-y-5 pt-2 ${canEdit ? 'pb-20' : ''}`}>
      <div>
        <BackLink to="/">ทริปของฉัน</BackLink>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h1 className="min-w-0 text-2xl font-bold break-words">{trip.name}</h1>
          <TripStatusBadge status={trip.status} />
        </div>
        <p className="mt-1 text-slate">
          {trip.originName ? `${trip.originName} → ` : ''}
          {trip.destinationName}
        </p>
        <p className="tabular text-slate">
          {formatDateRange(trip.startDate, trip.endDate)} · {trip.dayCount} วัน
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <Stat label="ใช้ไปแล้ว" value={formatMoney(trip.totalSpent, trip.currency)} />
        {trip.remaining === null ? (
          <Stat label="งบ" value="ไม่ได้ตั้ง" />
        ) : (
          <Stat
            label={overBudget ? 'เกินงบ' : 'เหลือ'}
            value={formatMoney(trip.remaining.replace('-', ''), trip.currency)}
            hint={`จากงบ ${formatMoney(trip.budgetAmount, trip.currency)}`}
            danger={overBudget}
          />
        )}
      </dl>

      <RecentExpenses trip={trip} />

      {isOwner && <TripStatusActions trip={trip} />}

      <section className="rounded-2xl bg-paper p-4 ring-1 ring-line">
        <h2 className="font-semibold">คนร่วมทริป {trip.members.length} คน</h2>
        <ul className="mt-2 divide-y divide-line">
          {trip.members.map((member) => (
            <li key={member.id} className="flex min-h-11 items-center justify-between gap-3">
              <span className="min-w-0 truncate">
                {member.displayName}
                {member.isMe && <span className="text-slate"> (คุณ)</span>}
              </span>
              {member.role === 'owner' && <span className="text-sm text-slate">เจ้าของทริป</span>}
            </li>
          ))}
        </ul>
      </section>

      {isOwner && (
        <Link
          to={`/trips/${trip.id}/settings`}
          className="flex min-h-11 items-center justify-center rounded-lg font-medium text-teal active:bg-teal/10"
        >
          แก้ไขทริป
        </Link>
      )}

      {canEdit && <QuickAddExpense trip={trip} />}
    </section>
  );
}

function Stat({ label, value, hint, danger = false }) {
  return (
    <div className="rounded-2xl bg-paper p-4 ring-1 ring-line">
      <dt className={`text-sm ${danger ? 'font-semibold text-danger' : 'text-slate'}`}>{label}</dt>
      <dd
        className={`tabular mt-0.5 text-lg font-semibold break-words ${danger ? 'text-danger' : ''}`}
      >
        {value}
      </dd>
      {hint && <dd className="tabular text-xs text-slate">{hint}</dd>}
    </div>
  );
}
