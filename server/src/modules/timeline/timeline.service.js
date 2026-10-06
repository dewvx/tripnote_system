import { Prisma } from '@prisma/client';

import { dayKeyFormatter, tripDayNumber } from '../../utils/datetime.js';
import { formatMoney } from '../../utils/money.js';
import * as expensesRepository from '../expenses/expenses.repository.js';
import * as journalRepository from '../journal/journal.repository.js';

// Timeline เป็น read model (ARCHITECTURE.md §2.7) ไม่มีตารางของตัวเอง
// = บันทึก (พร้อมรายจ่ายที่ผูกอยู่) + รายจ่ายที่ไม่ได้ผูกกับบันทึกใด เรียงตามเวลา จัดกลุ่มตามวันของทริป
// totalSpent ของวันนับรายจ่ายทุกตัวที่เกิดวันนั้น รวมตัวที่ผูกกับบันทึก ด้วย Prisma.Decimal
export async function getTimeline(trip) {
  const [entries, expenses] = await Promise.all([
    journalRepository.listEntries(trip.id),
    expensesRepository.listForTimeline(trip.id),
  ]);
  const toDay = dayKeyFormatter(trip.timezone);
  const liveEntryIds = new Set(entries.map((entry) => entry.id));

  const linked = new Map();
  const items = [];
  for (const { journalEntryId, ...expense } of expenses) {
    // ผูกกับบันทึกที่ถูกลบไปแล้ว ให้กลับมาเป็นแถวเดี่ยว ไม่หายไปจาก timeline
    if (journalEntryId && liveEntryIds.has(journalEntryId)) {
      linked.set(journalEntryId, [...(linked.get(journalEntryId) ?? []), expense]);
    } else {
      items.push({ kind: 'expense', at: expense.spentAt, expense });
    }
  }
  for (const entry of entries) {
    items.push({
      kind: 'entry',
      at: entry.occurredAt,
      entry: { ...entry, expenses: linked.get(entry.id) ?? [] },
    });
  }
  // เวลาเท่ากันให้บันทึกมาก่อนรายจ่าย แล้วตาม id ผลจึงเหมือนเดิมทุกครั้ง
  const kindOrder = { entry: 0, expense: 1 };
  items.sort(
    (a, b) =>
      a.at - b.at ||
      kindOrder[a.kind] - kindOrder[b.kind] ||
      (a.entry ?? a.expense).id - (b.entry ?? b.expense).id,
  );

  const spentByDay = new Map();
  for (const expense of expenses) {
    const date = toDay(expense.spentAt);
    spentByDay.set(date, (spentByDay.get(date) ?? new Prisma.Decimal(0)).plus(expense.amount));
  }

  const days = [];
  for (const item of items) {
    const date = toDay(item.at);
    if (days.at(-1)?.date !== date) {
      days.push({
        date,
        dayNumber: tripDayNumber(date, trip.startDate, trip.endDate),
        totalSpent: formatMoney(spentByDay.get(date) ?? new Prisma.Decimal(0)),
        items: [],
      });
    }
    days.at(-1).items.push(item);
  }
  return { days };
}
