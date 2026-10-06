import { useState } from 'react';

import Sheet from '../../../components/ui/Sheet.jsx';
import { uuid } from '../../../utils/uuid.js';
import QuickAddNoteForm from './QuickAddNoteForm.jsx';

function newDraft() {
  return {
    // สร้างครั้งเดียวต่อบันทึก ใช้ซ้ำทุกครั้งที่กดบันทึกจนกว่าจะสำเร็จ
    clientId: uuid(),
    body: '',
    locationLabel: '',
    showLocation: false,
    occurredAt: null,
  };
}

// ปุ่ม "จดโน้ต" ซ้อนอยู่เหนือปุ่ม + ของรายจ่าย ในระยะนิ้วโป้งเหมือนกัน
// มีคำกำกับ ไม่ใช่ไอคอนอย่างเดียว คนจะได้ไม่สับสนกับปุ่มเพิ่มรายจ่าย
export default function QuickAddNote({ trip }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(newDraft);

  function handleSaved() {
    setOpen(false);
    setDraft(newDraft());
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-[max(1.25rem,calc(50vw-14rem+1.25rem))] bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+4.75rem)] z-10 flex min-h-12 items-center gap-1.5 rounded-full bg-paper px-4 font-semibold text-teal-deep shadow-lg ring-1 ring-line active:bg-mist"
      >
        <span aria-hidden="true">📝</span>
        จดโน้ต
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="จดโน้ต">
        <QuickAddNoteForm trip={trip} draft={draft} onChange={setDraft} onSaved={handleSaved} />
      </Sheet>
    </>
  );
}
