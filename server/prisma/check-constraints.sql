-- CHECK constraint ที่ประกาศใน schema.prisma ไม่ได้
-- วิธีใช้อยู่ใน docs/DEVELOPMENT.md หัวข้อ "สร้างฐานข้อมูลครั้งแรก"
-- (คัดลอกทั้งไฟล์ไปต่อท้าย migration.sql ของ migration แรก ก่อนสั่งรัน)

ALTER TABLE `trips`
  ADD CONSTRAINT `chk_trips_dates` CHECK (`end_date` >= `start_date`),
  ADD CONSTRAINT `chk_trips_budget` CHECK (`budget_amount` IS NULL OR `budget_amount` >= 0);

ALTER TABLE `itinerary_items`
  ADD CONSTRAINT `chk_itinerary_items_cost` CHECK (`estimated_cost` IS NULL OR `estimated_cost` >= 0);

ALTER TABLE `expenses`
  ADD CONSTRAINT `chk_expenses_amount` CHECK (`amount` > 0);

ALTER TABLE `journal_entries`
  ADD CONSTRAINT `chk_journal_entries_rating` CHECK (`rating` IS NULL OR `rating` BETWEEN 1 AND 5);
