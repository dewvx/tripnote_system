import { formatMoney } from '../../trips/format.js';
import { categoryIcon } from '../categoryIcons.js';

// หนึ่งแถวของรายจ่าย ถ้ามี onSelect ทั้งแถวเป็นปุ่มแตะเพื่อแก้ (คนที่แก้ไม่ได้จะไม่ได้ onSelect)
// timeFormat ส่งมาจากตัวแม่ สร้าง Intl ครั้งเดียวต่อรายการทั้งหมด ไม่ใช่ทุกแถว
export default function ExpenseRow({ expense, currency, timeFormat, onSelect }) {
  const content = (
    <>
      <span aria-hidden="true" className="text-2xl">
        {categoryIcon(expense.category.icon)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate">{expense.description || expense.category.nameTh}</span>
        <span className="block truncate text-sm text-slate">
          {expense.paidBy.displayName} จ่าย · {timeFormat.format(new Date(expense.spentAt))}
        </span>
      </span>
      <span className="tabular font-semibold">{formatMoney(expense.amount, currency)}</span>
    </>
  );

  if (!onSelect) {
    return <div className="flex min-h-14 items-center gap-3 py-2">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(expense)}
      className="-mx-2 flex min-h-14 w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2 text-left active:bg-mist"
    >
      {content}
    </button>
  );
}
