import { formatMoney } from '../../trips/format.js';
import { budgetBarPercent, budgetLevel } from '../budget.js';

// สีของแถบบอกสถานะ แต่ไม่ใช้สีอย่างเดียว ข้อความสถานะใต้แถบมีไอคอนและคำบอกเสมอ
const LEVEL = {
  ok: { bar: 'bg-teal', text: 'text-slate', icon: null },
  warning: { bar: 'bg-marigold', text: 'text-ink font-medium', icon: '⚠️' },
  over: { bar: 'bg-danger', text: 'text-danger font-semibold', icon: '⛔' },
};

function statusText(summary, level) {
  const money = (value) => formatMoney(value, summary.currency);
  if (level === 'over') return `เกินงบ ${money(summary.remaining.replace('-', ''))}`;
  const remaining = `เหลือ ${money(summary.remaining)}`;
  if (level === 'warning') return `${remaining} ใกล้เต็มงบแล้ว`;
  return remaining;
}

// แถบงบ: ใช้ไป / คงเหลือ / เปอร์เซ็นต์ (FEATURES.md F3.3)
export default function BudgetBar({ summary }) {
  const level = budgetLevel(summary);
  const money = (value) => formatMoney(value, summary.currency);

  if (level === 'none') {
    return (
      <div>
        <p className="text-sm text-slate">ใช้ไปแล้ว</p>
        <p className="tabular text-2xl font-bold">{money(summary.totalSpent)}</p>
        <p className="mt-1 text-sm text-slate">ยังไม่ได้ตั้งงบ ตั้งได้ที่หน้าแก้ไขทริป</p>
      </div>
    );
  }

  const style = LEVEL[level];
  const percent = budgetBarPercent(summary);

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate">ใช้ไปแล้ว</p>
          <p className="tabular text-2xl font-bold break-words">{money(summary.totalSpent)}</p>
        </div>
        {summary.budgetUsedPercent !== null && (
          <p className="tabular shrink-0 text-lg font-semibold">{summary.budgetUsedPercent}%</p>
        )}
      </div>

      <div aria-hidden="true" className="mt-2 h-3 overflow-hidden rounded-full bg-mist">
        <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${percent}%` }} />
      </div>

      <div className="mt-1.5 flex flex-wrap justify-between gap-x-3 text-sm">
        <p className={style.text}>
          {style.icon && (
            <span aria-hidden="true" className="mr-1">
              {style.icon}
            </span>
          )}
          {statusText(summary, level)}
        </p>
        <p className="tabular text-slate">งบ {money(summary.budgetAmount)}</p>
      </div>
    </div>
  );
}
