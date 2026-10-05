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
