// วันที่ตามแผน (DATE) เป็น "วันที่ของที่นั่น" ไม่มี timezone
// Prisma แทน DATE ด้วย Date ที่เวลา 00:00 UTC จึงต้องอ่าน/เขียนด้วยฝั่ง UTC เท่านั้น
// ห้ามใช้ getDate()/toLocaleDateString() ซึ่งขึ้นกับ timezone ของเครื่องที่รัน

export function parseDateOnly(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

// นับรวมทั้งวันแรกและวันสุดท้าย: 10–12 ต.ค. = 3 วัน
export function dayCount(startDate, endDate) {
  return Math.round((endDate - startDate) / 86_400_000) + 1;
}

// ฟังก์ชันแปลงเวลา (Date) เป็น "YYYY-MM-DD" ตาม timezone ของทริป ใช้จัดกลุ่มรายวัน (AGENTS.md §6)
// en-CA จัดรูปวันที่เป็น ISO พอดี
export function dayKeyFormatter(timezone) {
  const format = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return (date) => format.format(date);
}

// วันที่เท่าไหร่ของทริป ("YYYY-MM-DD" ทั้งหมด) นับวันเริ่มเป็นวันที่ 1 อยู่นอกช่วงทริปคืน null
export function tripDayNumber(date, startDate, endDate) {
  if (date < startDate || date > endDate) return null;
  return dayCount(parseDateOnly(startDate), parseDateOnly(date));
}
