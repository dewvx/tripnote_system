// ชื่อไอคอนใน expense_categories.icon → emoji
// ใช้ emoji แทนไลบรารีไอคอนเพื่อไม่เพิ่ม dependency ชื่อไม่รู้จักใช้ไอคอนกลาง
const ICONS = {
  bed: '🛏️',
  utensils: '🍜',
  bus: '🚌',
  fuel: '⛽',
  ticket: '🎟️',
  bag: '🛍️',
  sparkles: '✨',
  dots: '🧾',
};

export function categoryIcon(icon) {
  return ICONS[icon] ?? '🧾';
}
