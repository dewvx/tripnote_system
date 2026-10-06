import { Link } from 'react-router';

import ErrorState from '../../../components/ui/ErrorState.jsx';
import Spinner from '../../../components/ui/Spinner.jsx';
import { expenseTimeFormat } from '../../expenses/days.js';
import { useTimeline } from '../hooks.js';

// บันทึกล่าสุดบนหน้าทริป จดโน้ตแล้วเห็นผลทันทีโดยไม่ต้องเปิดไทม์ไลน์ (หลัก UX ข้อ 6)
// ใช้ข้อมูล timeline ชุดเดียวกับหน้าไทม์ไลน์ เปิดต่อไปจะไม่ต้องโหลดใหม่
export default function LatestNoteCard({ trip }) {
  const { data, error, isPending, refetch } = useTimeline(trip.id);
  const latest = data?.days
    .flatMap((day) => day.items)
    .findLast((item) => item.kind === 'entry')?.entry;

  return (
    <section className="rounded-2xl bg-paper p-4 ring-1 ring-line">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">บันทึกล่าสุด</h2>
        <Link
          to={`/trips/${trip.id}/journal`}
          className="-mr-2 flex min-h-11 items-center rounded-lg px-2 font-medium text-teal active:bg-teal/10"
        >
          ไทม์ไลน์
        </Link>
      </div>

      {isPending && <Spinner label="กำลังโหลดบันทึก" />}
      {error && <ErrorState message={error.message} onRetry={() => refetch()} />}
      {data && !latest && (
        <p className="text-slate">ยังไม่มีบันทึก แตะ “จดโน้ต” มุมขวาล่างเพื่อจดเรื่องแรก</p>
      )}
      {latest && (
        <div className="mt-1 rounded-lg border-l-4 border-teal bg-teal/5 px-3 py-2">
          <p className="flex items-baseline gap-2 text-sm text-slate">
            <span className="tabular shrink-0">
              {expenseTimeFormat(trip.timezone).format(new Date(latest.occurredAt))}
            </span>
            {latest.locationLabel && (
              <span className="min-w-0 truncate">
                <span aria-hidden="true">📍</span> {latest.locationLabel}
              </span>
            )}
          </p>
          {latest.body && <p className="mt-1 line-clamp-3 break-words">{latest.body}</p>}
        </div>
      )}
    </section>
  );
}
