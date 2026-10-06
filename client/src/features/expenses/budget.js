// สถานะงบจาก summary ของ server (FEATURES.md F3.3)
// none = ไม่ได้ตั้งงบ, ok, warning = ใช้ไปเกิน 80%, over = ใช้เกินงบ
// ดูจาก remaining ที่ติดลบก่อน เพราะงบ 0 บาททำให้ budgetUsedPercent เป็น null
export const WARNING_PERCENT = 80;

export function budgetLevel({ budgetAmount, remaining, budgetUsedPercent }) {
  if (budgetAmount === null) return 'none';
  if (remaining.startsWith('-')) return 'over';
  if (budgetUsedPercent !== null && budgetUsedPercent > WARNING_PERCENT) return 'warning';
  return 'ok';
}

// ความกว้างของแถบเป็น % ไม่เกิน 100 ใช้เกินงบแล้วแถบเต็ม
export function budgetBarPercent(summary) {
  if (budgetLevel(summary) === 'over') return 100;
  return Math.min(summary.budgetUsedPercent ?? 0, 100);
}
