import { useState } from 'react';

import Button from '../../../components/ui/Button.jsx';
import { fieldErrors } from '../../../utils/fieldErrors.js';
import SpentAtField from '../../expenses/components/SpentAtField.jsx';
import { useCreateEntry } from '../hooks.js';
import NoteFields from './NoteFields.jsx';

// แตะ จดโน้ต → พิมพ์ → บันทึก ช่องอื่นเลือกใส่
// draft อยู่ที่ตัวแม่ ปิด sheet แล้วเปิดใหม่ข้อความยังอยู่ และใช้ clientId เดิม กดซ้ำก็ไม่เกิดรายการซ้ำ
export default function QuickAddNoteForm({ trip, draft, onChange, onSaved }) {
  const createEntry = useCreateEntry(trip.id);
  const [clientErrors, setClientErrors] = useState({});
  const errors = { ...fieldErrors(createEntry.error), ...clientErrors };
  const update = (fields) => onChange({ ...draft, ...fields });

  function handleSubmit(event) {
    event.preventDefault();
    if (!draft.body.trim() && !draft.locationLabel.trim()) {
      setClientErrors({ body: 'พิมพ์ข้อความหรือชื่อสถานที่อย่างน้อยหนึ่งอย่าง' });
      return;
    }
    setClientErrors({});

    createEntry.mutate(
      {
        clientId: draft.clientId,
        body: draft.body,
        locationLabel: draft.locationLabel,
        // datetime-local เป็นเวลาของเครื่อง new Date() ตีความตามนั้นแล้วแปลงเป็น UTC ให้
        occurredAt: draft.occurredAt ? new Date(draft.occurredAt).toISOString() : undefined,
      },
      { onSuccess: onSaved },
    );
  }

  // error ที่ไม่ได้ผูกกับช่องไหน เช่นเน็ตหลุด
  const generalError = createEntry.error && !createEntry.error.details?.length;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <NoteFields values={draft} onChange={update} errors={errors} autoFocus />

      <SpentAtField
        value={draft.occurredAt}
        onChange={(occurredAt) => update({ occurredAt })}
        error={errors.occurredAt}
      />

      {generalError && (
        <div role="alert" className="rounded-lg bg-danger/5 p-3 text-danger">
          <p className="font-medium">บันทึกไม่สำเร็จ</p>
          <p className="text-sm">{createEntry.error.message}</p>
          <p className="mt-1 text-sm">ข้อความยังอยู่ครบ กดบันทึกอีกครั้งได้ ไม่เกิดรายการซ้ำ</p>
        </div>
      )}

      <Button type="submit" loading={createEntry.isPending} className="w-full">
        {createEntry.isPending ? 'กำลังบันทึก' : generalError ? 'ลองบันทึกอีกครั้ง' : 'บันทึก'}
      </Button>
    </form>
  );
}
