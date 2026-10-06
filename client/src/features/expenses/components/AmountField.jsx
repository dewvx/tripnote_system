import { useId } from 'react';

// ช่องจำนวนเงินตัวใหญ่ แป้นตัวเลขขึ้นทันทีบนมือถือ (inputMode="decimal")
// type="text" ไม่ใช่ number เพื่อรับจุลภาคที่พิมพ์มาได้ แล้วให้ parseAmountInput ตรวจ
export default function AmountField({ value, onChange, error, autoFocus = false }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="font-medium">
        จำนวนเงิน (บาท)
      </label>
      <input
        id={id}
        data-autofocus={autoFocus || undefined}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        enterKeyHint="done"
        placeholder="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`tabular mt-1.5 block min-h-16 w-full rounded-xl border bg-paper px-4 text-right text-3xl font-semibold ${
          error ? 'border-danger' : 'border-line'
        } focus:border-teal focus:outline-none`}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
