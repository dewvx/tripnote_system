import { useState } from 'react';
import { useParams } from 'react-router';

import BackLink from '../components/ui/BackLink.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import EditExpenseSheet from '../features/expenses/components/EditExpenseSheet.jsx';
import QuickAddExpense from '../features/expenses/components/QuickAddExpense.jsx';
import EditEntrySheet from '../features/journal/components/EditEntrySheet.jsx';
import QuickAddNote from '../features/journal/components/QuickAddNote.jsx';
import TimelineDays from '../features/journal/components/TimelineDays.jsx';
import { useTimeline } from '../features/journal/hooks.js';
import TripNotFound from '../features/trips/components/TripNotFound.jsx';
import { useTrip } from '../features/trips/hooks.js';

// Timeline แบบง่ายของ v0.1 (ROADMAP §3): บันทึกกับรายจ่ายเรียงตามเวลา จัดกลุ่มรายวัน
// ยังไม่มีรูป คะแนน และการเลือกสถานที่จากแผน
export default function JournalPage() {
  const { tripId } = useParams();
  const trip = useTrip(tripId);
  const timeline = useTimeline(tripId);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  if (trip.isPending) return <Spinner label="กำลังโหลดทริป" />;
  if (trip.error?.code === 'TRIP_NOT_FOUND') return <TripNotFound />;
  if (trip.error) return <ErrorState message={trip.error.message} onRetry={() => trip.refetch()} />;

  const canEdit = ['owner', 'editor'].includes(trip.data.myRole);
  const days = timeline.data?.days;

  return (
    <section className={`space-y-4 pt-2 ${canEdit ? 'pb-36' : ''}`}>
      <div>
        <BackLink to={`/trips/${tripId}`}>{trip.data.name}</BackLink>
        <h1 className="mt-1 text-2xl font-bold">ไทม์ไลน์</h1>
      </div>

      {timeline.isPending && <Spinner label="กำลังโหลดไทม์ไลน์" />}
      {timeline.error && (
        <ErrorState message={timeline.error.message} onRetry={() => timeline.refetch()} />
      )}
      {days?.length === 0 && (
        <p className="rounded-2xl bg-paper p-4 text-slate ring-1 ring-line">
          ยังไม่มีอะไรในไทม์ไลน์ แตะ “จดโน้ต” หรือ + มุมขวาล่างเพื่อเริ่มบันทึกการเดินทาง
        </p>
      )}
      {days?.length > 0 && (
        <TimelineDays
          trip={trip.data}
          days={days}
          onSelectEntry={canEdit ? setEditingEntry : undefined}
          onSelectExpense={canEdit ? setEditingExpense : undefined}
        />
      )}

      {canEdit && (
        <>
          <EditEntrySheet
            trip={trip.data}
            entry={editingEntry}
            onClose={() => setEditingEntry(null)}
          />
          <EditExpenseSheet
            trip={trip.data}
            expense={editingExpense}
            onClose={() => setEditingExpense(null)}
          />
          <QuickAddNote trip={trip.data} />
          <QuickAddExpense trip={trip.data} />
        </>
      )}
    </section>
  );
}
