import { useState } from 'react';

import Button from '../../../components/ui/Button.jsx';
import Sheet from '../../../components/ui/Sheet.jsx';
import TextField from '../../../components/ui/TextField.jsx';
import { fieldErrors } from '../../../utils/fieldErrors.js';
import { expenseTimeFormat } from '../../expenses/days.js';
import { toLocalInputValue } from '../../expenses/localTime.js';
import { useDeleteEntry, useUpdateEntry } from '../hooks.js';
import NoteFields from './NoteFields.jsx';

function EditEntryForm({ trip, entry, onSaved, onDelete }) {
  const updateEntry = useUpdateEntry(trip.id);
  const [initial] = useState(() => ({
    body: entry.body ?? '',
    locationLabel: entry.locationLabel ?? '',
    showLocation: Boolean(entry.locationLabel),
    occurredAt: toLocalInputValue(new Date(entry.occurredAt)),
  }));
  const [values, setValues] = useState(initial);
  const [clientErrors, setClientErrors] = useState({});
  const errors = { ...fieldErrors(updateEntry.error), ...clientErrors };
  const update = (fields) => setValues((current) => ({ ...current, ...fields }));

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!values.body.trim() && !values.locationLabel.trim()) {
      nextErrors.body = 'พิมพ์ข้อความหรือชื่อสถานที่อย่างน้อยหนึ่งอย่าง';
    }
    if (!values.occurredAt) nextErrors.occurredAt = 'กรุณาใส่เวลา';
    setClientErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    updateEntry.mutate(
      {
        entryId: entry.id,
        body: values.body,
        locationLabel: values.locationLabel,
        // input ละเอียดแค่นาที ส่งเฉพาะตอนแก้จริง วินาทีเดิมจะได้ไม่หาย
        ...(values.occurredAt !== initial.occurredAt && {
          occurredAt: new Date(values.occurredAt).toISOString(),
        }),
      },
      { onSuccess: onSaved },
    );
  }

  const generalError = updateEntry.error && !updateEntry.error.details?.length;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <NoteFields values={values} onChange={update} errors={errors} />

      <TextField
        label="เวลา"
        type="datetime-local"
        value={values.occurredAt}
        onChange={(event) => update({ occurredAt: event.target.value })}
        error={errors.occurredAt}
      />

      {generalError && (
        <div role="alert" className="rounded-lg bg-danger/5 p-3 text-danger">
          <p className="font-medium">บันทึกไม่สำเร็จ</p>
          <p className="text-sm">{updateEntry.error.message}</p>
        </div>
      )}

      <div className="space-y-2">
        <Button type="submit" loading={updateEntry.isPending} className="w-full">
          {updateEntry.isPending ? 'กำลังบันทึก' : 'บันทึกการแก้ไข'}
        </Button>
        <Button
          variant="danger-ghost"
          onClick={onDelete}
          disabled={updateEntry.isPending}
          className="w-full"
        >
          ลบบันทึกนี้
        </Button>
      </div>
    </form>
  );
}

// การลบต้องยืนยันและบอกชัดว่าอะไรจะหายไป (หลัก UX ข้อ 7)
function DeleteEntryConfirm({ trip, entry, onCancel, onDeleted }) {
  const deleteEntry = useDeleteEntry(trip.id);
  const when = expenseTimeFormat(trip.timezone).format(new Date(entry.occurredAt));
  const preview = entry.body ?? entry.locationLabel;

  return (
    <div role="alertdialog" aria-labelledby="delete-entry-title" className="space-y-4">
      <p id="delete-entry-title">
        ลบบันทึกเมื่อ {when}
        <span className="mt-1 line-clamp-3 block rounded-lg bg-mist px-3 py-2 break-words">
          {preview}
        </span>
      </p>
      {entry.expenses.length > 0 && (
        <p className="text-sm text-slate">รายจ่ายที่ผูกอยู่ไม่ถูกลบ จะแสดงเป็นรายการแยกแทน</p>
      )}

      {deleteEntry.error && (
        <p role="alert" className="text-sm text-danger">
          {deleteEntry.error.message}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button variant="ghost" onClick={onCancel} disabled={deleteEntry.isPending}>
          ยกเลิก
        </Button>
        <Button
          variant="danger"
          loading={deleteEntry.isPending}
          onClick={() => deleteEntry.mutate({ entryId: entry.id }, { onSuccess: onDeleted })}
        >
          ลบบันทึก
        </Button>
      </div>
    </div>
  );
}

// แตะบันทึกเพื่อแก้ ลบได้จากในนี้หลังยืนยัน entry = null คือปิด
export default function EditEntrySheet({ trip, entry, onClose }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function close() {
    setConfirmingDelete(false);
    onClose();
  }

  return (
    <Sheet
      open={Boolean(entry)}
      onClose={close}
      title={confirmingDelete ? 'ลบบันทึกนี้?' : 'แก้บันทึก'}
    >
      {entry &&
        (confirmingDelete ? (
          <DeleteEntryConfirm
            trip={trip}
            entry={entry}
            onCancel={() => setConfirmingDelete(false)}
            onDeleted={close}
          />
        ) : (
          <EditEntryForm
            key={entry.id}
            trip={trip}
            entry={entry}
            onSaved={close}
            onDelete={() => setConfirmingDelete(true)}
          />
        ))}
    </Sheet>
  );
}
