import { expenseTimeFormat, formatDayHeading } from '../../expenses/days.js';
import ExpenseRow from '../../expenses/components/ExpenseRow.jsx';
import { formatMoney } from '../../trips/format.js';

// บันทึกเป็นการ์ดเด่น ข้อความยาวขึ้นบรรทัดตามที่พิมพ์ รายจ่ายเป็นแถวเล็กไม่แย่งความเด่น (FEATURES.md F4.4)
function EntryItem({ entry, time, currency, onSelect, onSelectExpense, timeFormat }) {
  const content = (
    <>
      <span className="flex items-baseline gap-2 text-sm text-slate">
        <span className="tabular font-medium text-ink">{time}</span>
        {entry.locationLabel && (
          <span className="min-w-0 truncate">
            <span aria-hidden="true">📍</span> {entry.locationLabel}
          </span>
        )}
      </span>
      {entry.body && (
        <span className="mt-1 block break-words whitespace-pre-wrap">{entry.body}</span>
      )}
    </>
  );

  return (
    <li className="py-2">
      {onSelect ? (
        <button
          type="button"
          onClick={() => onSelect(entry)}
          className="-mx-2 block w-[calc(100%+1rem)] rounded-lg border-l-4 border-teal bg-teal/5 px-3 py-2 text-left active:bg-teal/10"
        >
          {content}
        </button>
      ) : (
        <div className="rounded-lg border-l-4 border-teal bg-teal/5 px-3 py-2">{content}</div>
      )}
      {entry.expenses.length > 0 && (
        <ul className="mt-1 ml-3 divide-y divide-line">
          {entry.expenses.map((expense) => (
            <li key={expense.id}>
              <ExpenseRow
                expense={expense}
                currency={currency}
                timeFormat={timeFormat}
                onSelect={onSelectExpense}
              />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function TimelineDays({ trip, days, onSelectEntry, onSelectExpense }) {
  const timeFormat = expenseTimeFormat(trip.timezone, { withDate: false });

  return (
    <div className="space-y-4">
      {days.map((day) => (
        <section
          key={day.date}
          aria-labelledby={`timeline-${day.date}`}
          className="rounded-2xl bg-paper px-4 pt-3 pb-1 ring-1 ring-line"
        >
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
            <h2 id={`timeline-${day.date}`} className="font-semibold">
              {formatDayHeading(day.date)}
              {day.dayNumber && (
                <span className="ml-1.5 text-sm font-normal text-slate">
                  วันที่ {day.dayNumber}
                </span>
              )}
            </h2>
            {day.totalSpent !== '0.00' && (
              <p className="tabular text-sm text-slate">
                ใช้ไป {formatMoney(day.totalSpent, trip.currency)}
              </p>
            )}
          </div>
          <ul className="divide-y divide-line">
            {day.items.map((item) =>
              item.kind === 'entry' ? (
                <EntryItem
                  key={`entry-${item.entry.id}`}
                  entry={item.entry}
                  time={timeFormat.format(new Date(item.at))}
                  currency={trip.currency}
                  timeFormat={timeFormat}
                  onSelect={onSelectEntry}
                  onSelectExpense={onSelectExpense}
                />
              ) : (
                <li key={`expense-${item.expense.id}`} className="text-sm">
                  <ExpenseRow
                    expense={item.expense}
                    currency={trip.currency}
                    timeFormat={timeFormat}
                    onSelect={onSelectExpense}
                  />
                </li>
              ),
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}
