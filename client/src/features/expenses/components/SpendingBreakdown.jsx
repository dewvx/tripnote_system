import { formatMoney } from '../../trips/format.js';
import { categoryIcon } from '../categoryIcons.js';
import { formatDayHeading, tripDayNumber } from '../days.js';

// แถบแนวนอนสีเดียว ทุกแถวมีชื่อและตัวเลขกำกับ สีไม่ได้บอกตัวตนของหมวด ไอคอนกับชื่อบอก
function BarRow({ label, value, detail, percent }) {
  return (
    <li className="py-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate">{label}</span>
        <span className="tabular shrink-0 font-semibold">{value}</span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full bg-mist">
          {/* แท่งที่มีค่าแต่สัดส่วนปัดเป็นศูนย์ยังเห็นเป็นขีดเล็ก ๆ */}
          <div
            className="h-full rounded-full bg-teal"
            style={{ width: `${Math.max(percent, 1)}%` }}
          />
        </div>
        <span className="tabular w-24 shrink-0 text-right text-xs text-slate">{detail}</span>
      </div>
    </li>
  );
}

export function CategoryBreakdown({ summary }) {
  return (
    <ul className="divide-y divide-line">
      {summary.byCategory.map((category) => (
        <BarRow
          key={category.categoryId}
          label={
            <>
              <span aria-hidden="true" className="mr-1.5">
                {categoryIcon(category.icon)}
              </span>
              {category.name ?? 'ไม่ทราบหมวด'}
            </>
          }
          value={formatMoney(category.total, summary.currency)}
          detail={`${category.percent ?? 0}% · ${category.count} รายการ`}
          percent={category.percent ?? 0}
        />
      ))}
    </ul>
  );
}

export function DailyTotals({ summary, trip }) {
  // ความยาวแท่งเทียบกับวันที่ใช้มากที่สุด แปลงเป็น number เพื่อวาดเท่านั้น ยอดที่แสดงยังเป็น string จาก server
  const max = Math.max(...summary.byDay.map((day) => Number(day.total)));

  return (
    <ul className="divide-y divide-line">
      {summary.byDay.map((day) => {
        const dayNumber = tripDayNumber(day.date, trip.startDate, trip.endDate);
        return (
          <BarRow
            key={day.date}
            label={
              <>
                {formatDayHeading(day.date)}
                {dayNumber && <span className="ml-1.5 text-sm text-slate">วันที่ {dayNumber}</span>}
              </>
            }
            value={formatMoney(day.total, summary.currency)}
            detail={`${day.count} รายการ`}
            percent={max > 0 ? (Number(day.total) / max) * 100 : 0}
          />
        );
      })}
    </ul>
  );
}
