import { prisma } from '../../lib/prisma.js';

const publicCategory = { id: true, code: true, nameTh: true, icon: true, color: true };

export function listActiveCategories() {
  return prisma.expenseCategory.findMany({
    where: { isActive: true },
    select: publicCategory,
    orderBy: { sortOrder: 'asc' },
  });
}

// รวมหมวดที่ปิดใช้แล้วด้วย รายจ่ายเก่าที่อยู่ในหมวดนั้นยังต้องแสดงชื่อได้
export function findCategoriesByIds(ids) {
  return prisma.expenseCategory.findMany({ where: { id: { in: ids } }, select: publicCategory });
}

export function findActiveCategory(id) {
  return prisma.expenseCategory.findFirst({
    where: { id, isActive: true },
    select: publicCategory,
  });
}
