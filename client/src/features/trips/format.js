// วันที่ของทริปเป็น "YYYY-MM-DD" ตามเวลาท้องถิ่นของทริป ไม่มี timezone
// แปลงเป็น Date ที่ 00:00 UTC แล้วจัดรูปด้วย timeZone: 'UTC' วันจะได้ไม่เลื่อนตาม timezone ของเครื่อง
function toUtcDate(value) {
  return new Date(`${value}T00:00:00Z`);
}

const dayMonth = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});
const fullDate = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

// "10–12 ต.ค. 2569" หรือ "30 ก.ย. – 2 ต.ค. 2569"
export function formatDateRange(startDate, endDate) {
  const start = toUtcDate(startDate);
  const end = toUtcDate(endDate);
  if (startDate === endDate) return fullDate.format(start);
  if (startDate.slice(0, 7) === endDate.slice(0, 7)) {
    return `${start.getUTCDate()}–${fullDate.format(end)}`;
  }
  return `${dayMonth.format(start)} – ${fullDate.format(end)}`;
}

// เงินมาจาก API เป็น string เช่น "7000.50" ใส่จุลภาคที่ตัวเลขเต็มโดยไม่แปลงเป็น number
export function formatMoney(amount, currency = 'THB') {
  if (amount == null) return null;
  const [whole, fraction = '00'] = amount.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const suffix = currency === 'THB' ? ' บาท' : ` ${currency}`;
  return `${grouped}${fraction === '00' ? '' : `.${fraction}`}${suffix}`;
}

export const STATUS_LABELS = {
  planning: 'วางแผน',
  active: 'กำลังเดินทาง',
  completed: 'จบทริปแล้ว',
  cancelled: 'ยกเลิก',
};

export const STATUS_STYLES = {
  planning: 'bg-mist text-slate',
  active: 'bg-marigold/20 text-ink',
  completed: 'bg-teal/10 text-teal-deep',
  cancelled: 'bg-danger/10 text-danger',
};
