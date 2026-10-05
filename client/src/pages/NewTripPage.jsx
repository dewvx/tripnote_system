import { useState } from 'react';
import { useNavigate } from 'react-router';

import BackLink from '../components/ui/BackLink.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import MemberCountField from '../features/trips/components/MemberCountField.jsx';
import TripForm from '../features/trips/components/TripForm.jsx';
import { useCreateTrip } from '../features/trips/hooks.js';

export default function NewTripPage() {
  const { user } = useAuth();
  const [guests, setGuests] = useState([]);
  const createTrip = useCreateTrip();
  const navigate = useNavigate();

  function handleSubmit(values) {
    createTrip.mutate(
      { ...values, members: guests.map((displayName) => ({ displayName })) },
      { onSuccess: (trip) => navigate(`/trips/${trip.id}`, { replace: true }) },
    );
  }

  return (
    <section className="pt-2">
      <BackLink to="/">ทริปของฉัน</BackLink>
      <h1 className="mt-1 mb-5 text-2xl font-bold">สร้างทริป</h1>
      <TripForm
        error={createTrip.error}
        isPending={createTrip.isPending}
        submitLabel="สร้างทริป"
        pendingLabel="กำลังสร้าง"
        onSubmit={handleSubmit}
      >
        <MemberCountField
          myName={user.displayName}
          guests={guests}
          onChange={setGuests}
          error={createTrip.error}
        />
      </TripForm>
    </section>
  );
}
