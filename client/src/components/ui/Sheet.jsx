import { useId, useLayoutEffect, useRef } from 'react';

// bottom sheet จาก <dialog> ของเบราว์เซอร์: ได้ focus trap, ปุ่ม Esc และพื้นหลังทึบมาฟรี
// เนื้อหา render เฉพาะตอนเปิด ช่องที่มี data-autofocus จะได้ focus ทันทีที่เปิด
// (React ไม่ใส่ attribute autofocus ลง DOM จริง showModal จึงหาเองไม่เจอ ต้องสั่ง focus เอง)
// เปิดใน event handler ของการแตะ → useLayoutEffect ทำงานใน gesture เดียวกัน แป้นพิมพ์มือถือจึงขึ้นได้
export default function Sheet({ open, onClose, title, children }) {
  const ref = useRef(null);
  const titleId = useId();

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector('[data-autofocus]')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // แตะพื้นหลังนอก sheet = ปิด (คลิกที่ตัว dialog เองแปลว่าโดน backdrop)
  function handleClick(event) {
    if (event.target === ref.current) onClose();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={handleClick}
      className="mx-auto mt-auto mb-0 max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-paper p-0 text-ink backdrop:bg-ink/40"
    >
      {open && (
        <div className="px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div aria-hidden="true" className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิด"
              className="-mr-2 size-11 rounded-full text-2xl leading-none text-slate active:bg-mist"
            >
              ×
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
