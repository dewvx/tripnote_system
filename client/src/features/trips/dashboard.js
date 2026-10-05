// ตรรกะของหน้า Dashboard แยกเป็นฟังก์ชันล้วน ทดสอบได้โดยไม่ต้อง render

// "วันนี้" ตามเวลาท้องถิ่นของทริป ไม่ใช่ของเครื่อง (AGENTS.md §6 การจัดกลุ่มรายวันใช้ trips.timezone)
// en-CA จัดรูปเป็น YYYY-MM-DD พอดี
export function todayIn(timezone, now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);
}

// จำนวนวันจาก a ถึง b (วันที่แบบ YYYY-MM-DD) ติดลบได้
export function daysBetween(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

const byStartAsc = (a, b) => a.startDate.localeCompare(b.startDate);
const byEndDesc = (a, b) => b.endDate.localeCompare(a.endDate);

// แบ่งกลุ่มตามสถานะที่ผู้ใช้กดเอง ไม่เดาจากวันที่ เพราะทริปอาจเลื่อนหรือจบก่อนกำหนด
export function groupTrips(trips) {
  return {
    active: trips.filter((t) => t.status === 'active').sort(byStartAsc),
    upcoming: trips.filter((t) => t.status === 'planning').sort(byStartAsc),
    past: trips.filter((t) => t.status === 'completed' || t.status === 'cancelled').sort(byEndDesc),
  };
}

// ข้อความสั้นบนการ์ดตามสถานะ (FEATURES.md F1.4)
// คืน { text, tone } tone = 'normal' | 'attention' ไว้เลือกสี
export function tripProgress(trip, today = todayIn(trip.timezone)) {
  if (trip.status === 'planning') {
    const days = daysBetween(today, trip.startDate);
    if (days > 1) return { text: `อีก ${days} วัน`, tone: 'normal' };
    if (days === 1) return { text: 'พรุ่งนี้', tone: 'attention' };
    if (days === 0) return { text: 'วันนี้', tone: 'attention' };
    return { text: 'ถึงวันเดินทางแล้ว กดเริ่มทริปได้', tone: 'attention' };
  }

  if (trip.status === 'active') {
    const day = daysBetween(trip.startDate, today) + 1;
    if (day < 1) return { text: `ออกเดินทางก่อนกำหนด ${1 - day} วัน`, tone: 'normal' };
    if (day > trip.dayCount) return { text: 'เลยวันจบแล้ว กดจบทริปได้', tone: 'attention' };
    return { text: `วันที่ ${day} จาก ${trip.dayCount}`, tone: 'normal' };
  }

  return null;
}
