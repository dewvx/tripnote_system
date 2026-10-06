// จัดกลุ่มรายจ่ายตาม "วัน" ของทริป ใช้ trips.timezone ไม่ใช่ timezone ของเครื่อง (AGENTS.md §6)
// ต้องได้วันเดียวกับ meta.days ที่ server คิด ยอดรวมรายวันจึงจับคู่กับกลุ่มได้ตรง

// "YYYY-MM-DD" ของเวลานั้นตาม timezone ของทริป (en-CA จัดรูปวันที่เป็น ISO พอดี)
export function dayKey(isoString, timezone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(isoString));
}

// รายการที่เรียงใหม่ไปเก่าแล้ว → [{ date, expenses }] ลำดับเดิม
export function groupByDay(expenses, timezone) {
  const groups = [];
  for (const expense of expenses) {
    const date = dayKey(expense.spentAt, timezone);
    if (groups.at(-1)?.date !== date) groups.push({ date, expenses: [] });
    groups.at(-1).expenses.push(expense);
  }
  return groups;
}

// วันที่เท่าไหร่ของทริป นับวันเริ่มเป็นวันที่ 1 อยู่นอกช่วงทริปคืน null
export function tripDayNumber(date, startDate, endDate) {
  if (date < startDate || date > endDate) return null;
  return Math.round((Date.parse(date) - Date.parse(startDate)) / 86_400_000) + 1;
}

const headingFormat = new Intl.DateTimeFormat('th-TH', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

// "ส. 10 ต.ค." จาก "2026-10-10" ใช้ UTC กันวันเลื่อนตามเครื่อง
export function formatDayHeading(date) {
  return headingFormat.format(new Date(`${date}T00:00:00Z`));
}

// เวลาของรายจ่ายแสดงตามเวลาท้องถิ่นของทริป เช่น "10 ต.ค. 14:05" หรือ "14:05"
export function expenseTimeFormat(timezone, { withDate = true } = {}) {
  return new Intl.DateTimeFormat('th-TH', {
    ...(withDate && { day: 'numeric', month: 'short' }),
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  });
}
