// เงินใน API เป็น string ทศนิยมสองตำแหน่ง เช่น "350.00" (AGENTS.md §6)
// Prisma คืน DECIMAL เป็น Prisma.Decimal ซึ่งแม่นยำ ห้ามแปลงเป็น number ก่อนคำนวณ

export function formatMoney(value) {
  if (value === null || value === undefined) return null;
  return value.toFixed(2);
}
