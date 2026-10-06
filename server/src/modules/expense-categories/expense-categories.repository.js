import { prisma } from '../../lib/prisma.js';

const publicCategory = { id: true, code: true, nameTh: true, icon: true, color: true };

export function listActiveCategories() {
  return prisma.expenseCategory.findMany({
    where: { isActive: true },
    select: publicCategory,
    orderBy: { sortOrder: 'asc' },
  });
}

export function findActiveCategory(id) {
  return prisma.expenseCategory.findFirst({
    where: { id, isActive: true },
    select: publicCategory,
  });
}
