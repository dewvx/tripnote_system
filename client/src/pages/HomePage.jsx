import { Link } from 'react-router';

import ErrorState from '../components/ui/ErrorState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import TripCard from '../features/trips/components/TripCard.jsx';
import { useTrips } from '../features/trips/hooks.js';

const createLinkClass =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-teal px-5 font-medium text-paper active:bg-teal-deep';

// รายการทริปแบบเรียบ ๆ ของ F1.3 การจัดกลุ่มตามสถานะและการ์ดแบบละเอียดเป็นงานของ F1.4
export default function HomePage() {
  const { data: trips, error, isPending, refetch } = useTrips();

  return (
    <section className="pt-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">ทริปของฉัน</h1>
        {trips?.length > 0 && (
          <Link to="/trips/new" className={createLinkClass}>
            + สร้างทริป
          </Link>
        )}
      </div>

      <div className="mt-5">
        {isPending && <Spinner label="กำลังโหลดทริป" />}

        {error && <ErrorState message={error.message} onRetry={() => refetch()} />}

        {trips?.length === 0 && (
          <div className="rounded-2xl bg-paper p-6 text-center ring-1 ring-line">
            <p className="font-medium">ยังไม่มีทริป</p>
            <p className="mt-1 text-slate">สร้างทริปแรก แล้วเริ่มจดค่าใช้จ่ายได้ทันที</p>
            <Link to="/trips/new" className={`${createLinkClass} mt-4 w-full`}>
              สร้างทริปแรก
            </Link>
          </div>
        )}

        {trips?.length > 0 && (
          <ul className="space-y-3">
            {trips.map((trip) => (
              <li key={trip.id}>
                <TripCard trip={trip} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
