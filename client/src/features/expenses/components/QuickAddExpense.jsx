import { useState } from 'react';

import Sheet from '../../../components/ui/Sheet.jsx';
import { uuid } from '../../../utils/uuid.js';
import { defaultPayerId, getLastPayerId } from '../preferences.js';
import QuickAddExpenseForm from './QuickAddExpenseForm.jsx';

function newDraft(trip) {
  return {
    // สร้างครั้งเดียวต่อรายการ ใช้ซ้ำทุกครั้งที่กดบันทึกจนกว่าจะสำเร็จ
    clientId: uuid(),
    amount: '',
    categoryId: null,
    payerId: defaultPayerId(trip.members, getLastPayerId(trip.id)),
    spentAt: null,
    description: '',
    showDetails: false,
  };
}

// ปุ่ม + มุมขวาล่างในระยะนิ้วโป้ง (ARCHITECTURE.md §3.4) และ sheet เพิ่มรายจ่าย
export default function QuickAddExpense({ trip }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => newDraft(trip));

  function handleSaved() {
    setOpen(false);
    setDraft(newDraft(trip));
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="เพิ่มรายจ่าย"
        className="fixed right-[max(1.25rem,calc(50vw-14rem+1.25rem))] bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-10 flex size-16 items-center justify-center rounded-full bg-teal text-4xl leading-none text-paper shadow-lg active:bg-teal-deep"
      >
        +
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="เพิ่มรายจ่าย">
        <QuickAddExpenseForm trip={trip} draft={draft} onChange={setDraft} onSaved={handleSaved} />
      </Sheet>
    </>
  );
}
