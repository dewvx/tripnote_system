-- CHECK constraint ที่ Prisma schema ประกาศไม่ได้
-- เดิมตั้งใจให้คัดลอก prisma/check-constraints.sql ไปต่อท้าย migration แรก แต่ขั้นนั้นตกหล่น
-- migration แรก commit ไปแล้วแก้ไม่ได้ จึงเพิ่มเป็น migration ใหม่ (AGENTS.md §9)

ALTER TABLE `trips`
  ADD CONSTRAINT `chk_trips_dates` CHECK (`end_date` >= `start_date`),
  ADD CONSTRAINT `chk_trips_budget` CHECK (`budget_amount` IS NULL OR `budget_amount` >= 0);

ALTER TABLE `itinerary_items`
  ADD CONSTRAINT `chk_itinerary_items_cost` CHECK (`estimated_cost` IS NULL OR `estimated_cost` >= 0);

ALTER TABLE `expenses`
  ADD CONSTRAINT `chk_expenses_amount` CHECK (`amount` > 0);

ALTER TABLE `journal_entries`
  ADD CONSTRAINT `chk_journal_entries_rating` CHECK (`rating` IS NULL OR `rating` BETWEEN 1 AND 5);
