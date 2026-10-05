import { PrismaClient } from '@prisma/client';

// ข้อมูลอ้างอิงที่ทุก environment ต้องมี รันซ้ำกี่ครั้งก็ได้ (upsert)
// ข้อมูลตัวอย่างสำหรับ dev (ผู้ใช้ + ทริปนำร่อง) จะเพิ่มเมื่อระบบ auth เสร็จใน F1.2
const prisma = new PrismaClient();

const categories = [
  {
    code: 'accommodation',
    nameTh: 'ที่พัก',
    nameEn: 'Accommodation',
    icon: 'bed',
    color: '#5b6ee1',
  },
  { code: 'food', nameTh: 'อาหาร', nameEn: 'Food', icon: 'utensils', color: '#e2732d' },
  {
    code: 'transportation',
    nameTh: 'เดินทาง',
    nameEn: 'Transportation',
    icon: 'bus',
    color: '#0e6b6a',
  },
  { code: 'fuel', nameTh: 'น้ำมัน', nameEn: 'Fuel', icon: 'fuel', color: '#8a5a2b' },
  { code: 'tickets', nameTh: 'ตั๋ว/บัตร', nameEn: 'Tickets', icon: 'ticket', color: '#c2337b' },
  { code: 'shopping', nameTh: 'ช้อปปิ้ง', nameEn: 'Shopping', icon: 'bag', color: '#8b46c9' },
  {
    code: 'activities',
    nameTh: 'กิจกรรม',
    nameEn: 'Activities',
    icon: 'sparkles',
    color: '#1f8a4c',
  },
  { code: 'other', nameTh: 'อื่น ๆ', nameEn: 'Other', icon: 'dots', color: '#5a6b73' },
];

async function main() {
  for (const [index, category] of categories.entries()) {
    const data = { ...category, sortOrder: index + 1 };
    await prisma.expenseCategory.upsert({
      where: { code: category.code },
      update: data,
      create: data,
    });
  }
  console.info(`seed หมวดค่าใช้จ่ายแล้ว ${categories.length} หมวด`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
