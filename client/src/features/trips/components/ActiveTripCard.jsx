import { Link } from 'react-router';

import { tripProgress } from '../dashboard.js';
import { formatMoney } from '../format.js';

// ทริปที่กำลังเดินทาง อยู่บนสุดและเด่นที่สุด (FEATURES.md F1.4)
// กดทั้งการ์ดเข้าทริปได้เลย เป้าใหญ่ กดง่ายตอนมือไม่ว่าง
export default function ActiveTripCard({ trip }) {
  const progress = tripProgress(trip);
  const budget = formatMoney(trip.budgetAmount, trip.currency);

  return (
    <Link
      to={`/trips/${trip.id}`}
      className="block rounded-2xl bg-teal p-5 text-paper shadow-md active:bg-teal-deep"
    >
      <p className="text-sm font-medium text-paper/80">กำลังเดินทาง</p>
      <h3 className="mt-1 text-2xl leading-tight font-bold break-words">{trip.name}</h3>
      <p className="mt-0.5 text-paper/80">{trip.destinationName}</p>

      {progress && (
        <p
          className={`mt-4 inline-block rounded-full px-3 py-1 text-sm font-semibold ${
            progress.tone === 'attention' ? 'bg-marigold text-ink' : 'bg-paper/15'
          }`}
        >
          {progress.text}
        </p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-paper/20 pt-4">
        <div>
          <dt className="text-sm text-paper/80">ใช้ไปแล้ว</dt>
          <dd className="tabular text-lg font-semibold break-words">
            {formatMoney(trip.totalSpent, trip.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-paper/80">งบ</dt>
          <dd className="tabular text-lg font-semibold break-words">{budget ?? 'ไม่ได้ตั้ง'}</dd>
        </div>
      </dl>
    </Link>
  );
}
