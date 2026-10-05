import { useState } from 'react';
import { useNavigate } from 'react-router';

import Button from '../../../components/ui/Button.jsx';
import { useDeleteTrip } from '../hooks.js';

// การลบต้องยืนยันและบอกชัดว่าอะไรจะหายไป (หลัก UX ข้อ 7)
export default function DeleteTripSection({ trip }) {
  const [confirming, setConfirming] = useState(false);
  const deleteTrip = useDeleteTrip();
  const navigate = useNavigate();

  function handleDelete() {
    deleteTrip.mutate(trip.id, { onSuccess: () => navigate('/', { replace: true }) });
  }

  return (
    <section className="rounded-2xl border border-danger/30 p-4">
      <h2 className="font-semibold text-danger">ลบทริป</h2>

      {!confirming ? (
        <>
          <p className="mt-1 text-sm text-slate">ลบแล้วทุกคนในทริปจะเปิดทริปนี้ไม่ได้อีก</p>
          <Button variant="danger-ghost" onClick={() => setConfirming(true)} className="mt-2 -ml-4">
            ลบทริปนี้
          </Button>
        </>
      ) : (
        <div role="alertdialog" aria-labelledby="delete-trip-title" className="mt-2">
          <p id="delete-trip-title">
            ลบ <strong>{trip.name}</strong> พร้อมรายชื่อคนร่วมทริป รายจ่าย
            และบันทึกทั้งหมดในทริปนี้?
          </p>
          {deleteTrip.error && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {deleteTrip.error.message}
            </p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button
              variant="ghost"
              onClick={() => setConfirming(false)}
              disabled={deleteTrip.isPending}
            >
              ยกเลิก
            </Button>
            <Button loading={deleteTrip.isPending} onClick={handleDelete} variant="danger">
              ลบทริป
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
