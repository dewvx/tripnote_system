import { useId } from 'react';

// label + input + ข้อความผิดพลาด ในรูปแบบเดียวกันทั้งแอป
// ส่ง props อื่นของ <input> ผ่านได้ตรง ๆ (type, autoComplete, inputMode ...)
export default function TextField({ label, error, hint, ...inputProps }) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error || hint;

  return (
    <div>
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={`mt-1.5 block min-h-12 w-full rounded-lg border bg-paper px-3.5 text-base ${
          error ? 'border-danger' : 'border-line'
        } focus:border-teal focus:outline-none`}
        {...inputProps}
      />
      {message && (
        <p id={messageId} className={`mt-1.5 text-sm ${error ? 'text-danger' : 'text-slate'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
