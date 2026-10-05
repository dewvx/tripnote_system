import { Link } from 'react-router';

import ErrorState from '../components/ui/ErrorState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import ActiveTripCard from '../features/trips/components/ActiveTripCard.jsx';
import TripCard from '../features/trips/components/TripCard.jsx';
import { groupTrips } from '../features/trips/dashboard.js';
import { useTrips } from '../features/trips/hooks.js';

const createLinkClass =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-teal px-5 font-medium text-paper active:bg-teal-deep';

// Dashboard (F1.4): ทริปที่กำลังเดินทางอยู่บนสุด ตามด้วยกำลังจะถึง และที่ผ่านมา
export default function HomePage() {
  const { data: trips, error, isPending, refetch } = useTrips();
  const groups = trips ? groupTrips(trips) : null;

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

      <div className="mt-5 space-y-7">
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

        {groups && (
          <>
            {groups.active.length > 0 && (
              <TripGroup title="กำลังเดินทาง" hideTitle>
                {groups.active.map((trip) => (
                  <ActiveTripCard key={trip.id} trip={trip} />
                ))}
              </TripGroup>
            )}
            <TripGroup title="กำลังจะถึง" trips={groups.upcoming} />
            <TripGroup title="ที่ผ่านมา" trips={groups.past} />
          </>
        )}
      </div>
    </section>
  );
}

// กลุ่มที่ไม่มีทริปไม่ต้องแสดง หัวข้อว่าง ๆ เปลืองพื้นที่บนจอเล็ก
function TripGroup({ title, hideTitle = false, trips, children }) {
  if (!children && !trips?.length) return null;

  return (
    <section aria-label={hideTitle ? title : undefined}>
      {!hideTitle && <h2 className="mb-2 text-sm font-semibold text-slate">{title}</h2>}
      <div className="space-y-3">
        {children ?? trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
      </div>
    </section>
  );
}
