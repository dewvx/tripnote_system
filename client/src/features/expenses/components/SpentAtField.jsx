import { useId } from 'react';

import { toLocalInputValue } from '../localTime.js';

// เวลาเป็น "ตอนนี้" เสมอ เว้นแต่แตะเพื่อแก้ (หลัก UX ข้อ 4)
// value = null หมายถึงตอนนี้ (ให้ server ใส่เวลาตอนบันทึก) ไม่งั้นเป็นค่าจาก datetime-local
export default function SpentAtField({ value, onChange, error }) {
  const id = useId();

  if (value === null) {
    return (
      <div className="flex min-h-11 items-center justify-between gap-3">
        <span className="font-medium">เวลา</span>
        <button
          type="button"
          onClick={() => onChange(toLocalInputValue(new Date()))}
          className="min-h-11 rounded-lg px-3 text-teal active:bg-teal/10"
        >
          ตอนนี้ · แก้เวลา
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="font-medium">
          เวลา
        </label>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="min-h-11 rounded-lg px-3 text-teal active:bg-teal/10"
        >
          ใช้เวลาตอนนี้
        </button>
      </div>
      <input
        id={id}
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        className={`mt-1 block min-h-12 w-full rounded-lg border bg-paper px-3.5 text-base ${
          error ? 'border-danger' : 'border-line'
        } focus:border-teal focus:outline-none`}
      />
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}
