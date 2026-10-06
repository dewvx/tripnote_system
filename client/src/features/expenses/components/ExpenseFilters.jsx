import { categoryIcon } from '../categoryIcons.js';

// ตัวกรองเป็นแถวชิปเลื่อนแนวนอน แตะเดียวเปลี่ยน ไม่ต้องเปิด dropdown
// value = null คือไม่กรอง
function ChipRow({ label, allLabel, options, value, onChange }) {
  return (
    <fieldset>
      <legend className="text-sm text-slate">{label}</legend>
      <div role="radiogroup" className="-mx-5 mt-1 flex gap-2 overflow-x-auto px-5 pb-1">
        {[{ id: null, label: allLabel }, ...options].map((option) => {
          const selected = option.id === value;
          return (
            <button
              key={option.id ?? 'all'}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.id)}
              className={`min-h-11 shrink-0 rounded-full border px-4 ${
                selected
                  ? 'border-teal bg-teal font-semibold text-paper'
                  : 'border-line bg-paper active:bg-mist'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function ExpenseFilters({ categories, members, filters, onChange }) {
  return (
    <div className="space-y-2">
      <ChipRow
        label="หมวด"
        allLabel="ทุกหมวด"
        options={categories.map((c) => ({
          id: c.id,
          label: `${categoryIcon(c.icon)} ${c.nameTh}`,
        }))}
        value={filters.categoryId}
        onChange={(categoryId) => onChange({ ...filters, categoryId })}
      />
      <ChipRow
        label="ใครจ่าย"
        allLabel="ทุกคน"
        options={members.map((m) => ({
          id: m.id,
          label: m.isMe ? `${m.displayName} (คุณ)` : m.displayName,
        }))}
        value={filters.paidByMemberId}
        onChange={(paidByMemberId) => onChange({ ...filters, paidByMemberId })}
      />
    </div>
  );
}
