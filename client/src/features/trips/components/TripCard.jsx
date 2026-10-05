import { Link } from 'react-router';

import { tripProgress } from '../dashboard.js';
import { formatDateRange, formatMoney } from '../format.js';
import TripStatusBadge from './TripStatusBadge.jsx';

// การ์ดทริปในกลุ่ม "กำลังจะถึง" และ "ที่ผ่านมา"
// ทริปที่ยังไม่เริ่มแสดงนับถอยหลัง ทริปที่จบแล้วแสดงยอดใช้จ่ายรวม
export default function TripCard({ trip }) {
  const progress = tripProgress(trip);

  return (
    <Link
      to={`/trips/${trip.id}`}
      className="block rounded-2xl bg-paper p-4 shadow-sm ring-1 ring-line active:bg-mist"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 font-semibold break-words">{trip.name}</h3>
        {trip.status === 'cancelled' && <TripStatusBadge status={trip.status} />}
      </div>
      <p className="mt-0.5 text-slate">{trip.destinationName}</p>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="tabular text-sm text-slate">
          {formatDateRange(trip.startDate, trip.endDate)} · {trip.memberCount} คน
        </p>
        {progress ? (
          <p
            className={`text-sm font-semibold ${progress.tone === 'attention' ? 'text-danger' : 'text-teal'}`}
          >
            {progress.text}
          </p>
        ) : (
          <p className="tabular text-sm font-semibold">
            ใช้ไป {formatMoney(trip.totalSpent, trip.currency)}
          </p>
        )}
      </div>
    </Link>
  );
}
