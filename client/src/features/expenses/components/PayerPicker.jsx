// คนจ่ายเป็นปุ่มชื่อ (FEATURES.md F3.1) เลื่อนแนวนอนได้ถ้าคนเยอะ
export default function PayerPicker({ members, value, onChange, error }) {
  return (
    <fieldset>
      <legend className="font-medium">ใครจ่าย</legend>
      <div role="radiogroup" className="-mx-5 mt-1.5 flex gap-2 overflow-x-auto px-5 pb-1">
        {members.map((member) => {
          const selected = member.id === value;
          return (
            <button
              key={member.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(member.id)}
              className={`min-h-11 shrink-0 rounded-full border px-4 ${
                selected
                  ? 'border-teal bg-teal font-semibold text-paper'
                  : 'border-line bg-paper active:bg-mist'
              }`}
            >
              {member.displayName}
              {member.isMe && ' (คุณ)'}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </fieldset>
  );
}
