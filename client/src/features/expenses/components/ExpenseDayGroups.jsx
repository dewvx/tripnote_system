import { formatMoney } from '../../trips/format.js';
import { expenseTimeFormat, formatDayHeading, groupByDay, tripDayNumber } from '../days.js';
import ExpenseRow from './ExpenseRow.jsx';

// รายจ่ายแบ่งเป็นการ์ดรายวัน หัวการ์ดมียอดรวมของวันนั้นจาก server
// dayTotals = Map ของ "YYYY-MM-DD" → { total, count } จาก meta.days
export default function ExpenseDayGroups({ trip, expenses, dayTotals, onSelect }) {
  const timeFormat = expenseTimeFormat(trip.timezone, { withDate: false });

  return (
    <div className="space-y-4">
      {groupByDay(expenses, trip.timezone).map((group) => {
        const day = dayTotals.get(group.date);
        const dayNumber = tripDayNumber(group.date, trip.startDate, trip.endDate);
        return (
          <section
            key={group.date}
            aria-labelledby={`day-${group.date}`}
            className="rounded-2xl bg-paper px-4 pt-3 pb-1 ring-1 ring-line"
          >
            <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
              <h2 id={`day-${group.date}`} className="font-semibold">
                {formatDayHeading(group.date)}
                {dayNumber && (
                  <span className="ml-1.5 text-sm font-normal text-slate">วันที่ {dayNumber}</span>
                )}
              </h2>
              {day && (
                <p className="text-right">
                  <span className="tabular font-semibold">
                    {formatMoney(day.total, trip.currency)}
                  </span>
                  <span className="block text-xs text-slate">{day.count} รายการ</span>
                </p>
              )}
            </div>
            <ul className="divide-y divide-line">
              {group.expenses.map((expense) => (
                <li key={expense.id}>
                  <ExpenseRow
                    expense={expense}
                    currency={trip.currency}
                    timeFormat={timeFormat}
                    onSelect={onSelect}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
