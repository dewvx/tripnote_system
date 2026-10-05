import { fieldErrors } from '../../../utils/fieldErrors.js';

const MAX_GUESTS = 20;

export function defaultGuestName(index) {
  return `เพื่อน ${index + 1}`;
}

// จำนวนคนร่วมทริปเป็นปุ่ม +/− (FEATURES.md F1.3)
// ตัวผู้สร้างนับเป็นคนแรกเสมอ คนที่เพิ่มคือ guest ที่ตั้งชื่อเริ่มต้นให้และแก้ชื่อได้ทันที
export default function MemberCountField({ myName, guests, onChange, error }) {
  const errors = fieldErrors(error);
  const total = guests.length + 1;

  function add() {
    onChange([...guests, defaultGuestName(guests.length)]);
  }

  function remove() {
    onChange(guests.slice(0, -1));
  }

  function rename(index, name) {
    onChange(guests.map((guest, i) => (i === index ? name : guest)));
  }

  return (
    <fieldset>
      <legend className="font-medium">จำนวนคน</legend>
      <div className="mt-1.5 flex items-center gap-3">
        <StepButton label="ลดจำนวนคน" onClick={remove} disabled={guests.length === 0}>
          −
        </StepButton>
        <output aria-live="polite" className="tabular min-w-16 text-center text-xl font-semibold">
          {total} คน
        </output>
        <StepButton label="เพิ่มจำนวนคน" onClick={add} disabled={guests.length >= MAX_GUESTS}>
          +
        </StepButton>
      </div>

      <ul className="mt-3 space-y-2">
        <li className="flex min-h-12 items-center rounded-lg bg-mist px-3.5 text-slate">
          {myName} (คุณ)
        </li>
        {guests.map((name, index) => {
          const fieldError = errors[`members.${index}.displayName`];
          return (
            <li key={index}>
              <input
                aria-label={`ชื่อคนที่ ${index + 2}`}
                aria-invalid={fieldError ? true : undefined}
                value={name}
                maxLength={100}
                onChange={(event) => rename(index, event.target.value)}
                onFocus={(event) => event.target.select()}
                className={`block min-h-12 w-full rounded-lg border bg-paper px-3.5 text-base ${
                  fieldError ? 'border-danger' : 'border-line'
                } focus:border-teal focus:outline-none`}
              />
              {fieldError && <p className="mt-1 text-sm text-danger">{fieldError}</p>}
            </li>
          );
        })}
      </ul>
      {errors.members && <p className="mt-1.5 text-sm text-danger">{errors.members}</p>}
    </fieldset>
  );
}

function StepButton({ label, children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="size-12 rounded-full border border-line bg-paper text-2xl leading-none text-teal active:bg-teal/10 disabled:opacity-40"
      {...props}
    >
      {children}
    </button>
  );
}
