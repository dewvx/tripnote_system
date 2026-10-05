import { useNavigate, useParams } from 'react-router';

import BackLink from '../components/ui/BackLink.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import DeleteTripSection from '../features/trips/components/DeleteTripSection.jsx';
import TripForm from '../features/trips/components/TripForm.jsx';
import TripNotFound from '../features/trips/components/TripNotFound.jsx';
import { useTrip, useUpdateTrip } from '../features/trips/hooks.js';

export default function TripSettingsPage() {
  const { tripId } = useParams();
  const { data: trip, error, isPending, refetch } = useTrip(tripId);
  const updateTrip = useUpdateTrip();
  const navigate = useNavigate();

  if (isPending) return <Spinner label="กำลังโหลดทริป" />;
  if (error?.code === 'TRIP_NOT_FOUND') return <TripNotFound />;
  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;

  // แก้ได้เฉพาะ owner ฝั่ง server ตอบ 403 อยู่แล้ว หน้านี้แค่ไม่แสดงฟอร์มให้เสียเวลากรอก
  if (trip.myRole !== 'owner') {
    return (
      <section className="pt-2">
        <BackLink to={`/trips/${trip.id}`}>{trip.name}</BackLink>
        <p className="mt-4 text-slate">เฉพาะเจ้าของทริปที่แก้ไขทริปนี้ได้</p>
      </section>
    );
  }

  function handleSubmit(values) {
    updateTrip.mutate(
      { tripId: trip.id, ...values },
      { onSuccess: () => navigate(`/trips/${trip.id}`, { replace: true }) },
    );
  }

  return (
    <section className="space-y-8 pt-2">
      <div>
        <BackLink to={`/trips/${trip.id}`}>{trip.name}</BackLink>
        <h1 className="mt-1 mb-5 text-2xl font-bold">แก้ไขทริป</h1>
        <TripForm
          trip={trip}
          error={updateTrip.error}
          isPending={updateTrip.isPending}
          submitLabel="บันทึก"
          pendingLabel="กำลังบันทึก"
          onSubmit={handleSubmit}
        />
      </div>
      <DeleteTripSection trip={trip} />
    </section>
  );
}
