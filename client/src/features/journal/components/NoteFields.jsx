import { useId } from 'react';

import TextField from '../../../components/ui/TextField.jsx';

// ช่องข้อความกับชื่อสถานที่ ใช้ทั้งตอนจดและตอนแก้
// ชื่อสถานที่พิมพ์เองได้เลย ยังไม่มีการเลือกจากแผน (v0.1)
export default function NoteFields({ values, onChange, errors, autoFocus = false }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <>
      <div>
        <label htmlFor={id} className="font-medium">
          เกิดอะไรขึ้น
        </label>
        <textarea
          id={id}
          data-autofocus={autoFocus || undefined}
          rows={4}
          maxLength={5000}
          value={values.body}
          onChange={(event) => onChange({ body: event.target.value })}
          placeholder="เช่น มาถึงโคราชแล้ว อากาศร้อนมาก"
          aria-invalid={errors.body ? true : undefined}
          aria-describedby={errors.body ? errorId : undefined}
          className={`mt-1.5 block w-full rounded-lg border bg-paper px-3.5 py-3 text-base ${
            errors.body ? 'border-danger' : 'border-line'
          } focus:border-teal focus:outline-none`}
        />
        {errors.body && (
          <p id={errorId} className="mt-1.5 text-sm text-danger">
            {errors.body}
          </p>
        )}
      </div>

      {values.showLocation ? (
        <TextField
          label="ที่ไหน"
          value={values.locationLabel}
          onChange={(event) => onChange({ locationLabel: event.target.value })}
          maxLength={150}
          placeholder="เช่น ตลาดน้ำ, ร้านกาแฟริมทาง"
          error={errors.locationLabel}
        />
      ) : (
        <button
          type="button"
          onClick={() => onChange({ showLocation: true })}
          className="min-h-11 font-medium text-teal"
        >
          📍 เพิ่มสถานที่
        </button>
      )}
    </>
  );
}
