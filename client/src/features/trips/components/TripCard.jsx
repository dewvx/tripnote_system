import { Link } from 'react-router';

import { formatDateRange } from '../format.js';
import TripStatusBadge from './TripStatusBadge.jsx';

export default function TripCard({ trip }) {
  return (
    <Link
      to={`/trips/${trip.id}`}
      className="block rounded-2xl bg-paper p-4 shadow-sm ring-1 ring-line active:bg-mist"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 font-semibold break-words">{trip.name}</h2>
        <TripStatusBadge status={trip.status} />
      </div>
      <p className="mt-1 text-slate">{trip.destinationName}</p>
      <p className="tabular mt-1 text-sm text-slate">
        {formatDateRange(trip.startDate, trip.endDate)} · {trip.dayCount} วัน · {trip.memberCount}{' '}
        คน
      </p>
    </Link>
  );
}
