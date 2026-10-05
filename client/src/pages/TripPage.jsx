import { Link, useParams } from 'react-router';

import BackLink from '../components/ui/BackLink.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
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

  return (
    <section className="space-y-5 pt-2">
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
        <Stat label="งบ" value={formatMoney(trip.budgetAmount, trip.currency) ?? 'ไม่ได้ตั้ง'} />
      </dl>

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
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-paper p-4 ring-1 ring-line">
      <dt className="text-sm text-slate">{label}</dt>
      <dd className="tabular mt-0.5 text-lg font-semibold break-words">{value}</dd>
    </div>
  );
}
