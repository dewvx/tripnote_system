# AGENTS.md

คู่มือสำหรับ AI coding agent (Claude Code ฯลฯ) ที่ทำงานใน repo นี้
อ่านไฟล์นี้ก่อนแตะโค้ดทุกครั้ง

> ชื่อโปรเจกต์ `TripNote` เป็นชื่อชั่วคราว เปลี่ยนได้

---

## 1. สถานะปัจจุบัน

**v0.1 Trip-Ready — กำหนดเสร็จ 9 ต.ค. 2026** (แผนรายวันอยู่ที่ `docs/ROADMAP.md` §3)

- Architecture อนุมัติแล้วเมื่อ 5 ต.ค. 2026
- F1.1 Project Setup: ✅ เสร็จและ deploy ขึ้น production จริงแล้ว (5 ต.ค.)
  client: https://tripnote-client.vercel.app
  server: https://tripnote-system.vercel.app
- F1.2 Authentication: ✅ เสร็จ (6 ต.ค.) ตั้ง `JWT_ACCESS_SECRET` บน Vercel แล้ว
  ยืนยันจาก production deploy ที่ `/api/health` ตอบ `database: up`
  - **Known limitation:** rate limit ของ auth (`middlewares/rateLimit.js`) เก็บใน memory
    บน serverless แต่ละ instance นับแยกกันและรีเซ็ตเมื่อ instance ถูกปิด
    ยอมรับได้สำหรับ v0.1 ที่ใช้คนเดียวหรือสองคน แต่ต้องย้ายไป external store
    ก่อนเปิดให้คนอื่นใช้ (ขัดกับ §11 เรื่อง state ระดับ module)
- F1.3 Trip CRUD: ✅ เสร็จ (6 ต.ค.)
- F1.4 Dashboard: ✅ เสร็จ (6 ต.ค.) จัดกลุ่มตามสถานะที่ผู้ใช้กด ไม่เดาจากวันที่
  "วันนี้" คิดตาม `trips.timezone`
- F3.1 Quick Add Expense: ✅ เสร็จ (6 ต.ค.) ทดสอบบนมือถือจริงแล้ว
  จำแค่คนจ่ายล่าสุด (localStorage ต่อทริป) ไม่จำหมวด ตั้งใจแบบนี้ ไม่ต้องแก้
- F3.2 Expense History: ✅ เสร็จ (6 ต.ค.) ทดสอบบนมือถือจริงแล้ว
  ยอดรายวันมาจาก `meta.days` ของ server (ทั้งชุดที่กรอง ไม่ใช่แค่หน้าที่โหลด) ตัวกรองเก็บใน URL
- F3.3 Budget & Summary: ✅ เสร็จ (6 ต.ค.) ทดสอบบนมือถือจริงแล้ว
  การ์ดงบบนหน้าทริปกับหน้า `/trips/:tripId/summary` ใช้ `expenses/summary` ตัวเดียวกัน
  เตือนเมื่อเกิน 80% (มากกว่า ไม่ใช่เท่ากับ) ใช้ครบ 100% พอดียังไม่นับว่าเกินงบ
- งานถัดไป: **F3.4 Who Paid & Settlement** (ข้าม Phase 2 ตามแผน v0.1 ใน ROADMAP §3)
- เจ้าของโปรเจกต์ยังใหม่กับ Prisma เมื่อใช้ความสามารถของ Prisma ที่ยังไม่เคยปรากฏในโค้ด ให้อธิบายสั้น ๆ ว่ามันเทียบกับ SQL อย่างไร

## 2. โปรเจกต์นี้คืออะไร

Web app จัดการทริปแบบครบวงจร: **Trip Planner + Expense Tracker + Travel Journal**
วงจรการใช้งานคือ `Planning → Traveling → Recording → Reviewing`

ผู้ใช้หลักใช้ **มือถือระหว่างเดินทาง** สัญญาณอาจแย่ มือไม่ว่าง
ทุกการตัดสินใจด้าน UX ให้ยึดข้อนี้ก่อน

## 3. เอกสารที่ต้องอ่าน

| เรื่อง                                    | ไฟล์                       |
| ----------------------------------------- | -------------------------- |
| ภาพรวม, scope, non-goals                  | `docs/PROJECT_OVERVIEW.md` |
| Layer, auth, storage, folder structure    | `docs/ARCHITECTURE.md`     |
| ERD, ตาราง, index, constraint             | `docs/DATABASE.md`         |
| Endpoint, format, error code              | `docs/API.md`              |
| Feature แต่ละ phase + UX spec             | `docs/FEATURES.md`         |
| ลำดับการพัฒนา, Definition of Done         | `docs/ROADMAP.md`          |
| วิธีรัน, คำสั่ง, deploy, Prisma เบื้องต้น | `docs/DEVELOPMENT.md`      |

ถ้าโค้ดกับเอกสารไม่ตรงกัน ถือเป็น bug ต้องแก้ให้ตรงใน PR เดียวกัน

## 4. Tech Stack (ห้ามเปลี่ยนโดยไม่ถาม)

- **Frontend:** React + Vite + JavaScript, Tailwind CSS, React Router, Axios, TanStack Query
- **Backend:** Node.js 22 + Express 5, REST, JWT (access + refresh), bcrypt, Zod
- **Database:** MySQL 8 ผ่าน Prisma 6 (ตรึงเวอร์ชันไว้ ห้ามอัป major เอง)
- **Upload:** multer + sharp
- **Test:** Vitest + Supertest
- **Tooling:** ESLint, Prettier, `node --env-file` (ไม่ใช้ dotenv และ nodemon)
- **Deploy:** Vercel สอง project (client, server) + managed MySQL

จะเพิ่ม dependency ใหม่ ต้องบอกเหตุผลและถามก่อน

## 5. กฎเหล็กของ Architecture

Backend ไหลทางเดียว:

```
Route → Middleware (auth, validate, tripAccess) → Controller → Service → Repository → Prisma
```

- **Controller:** อ่าน request, เรียก service, ส่ง response เท่านั้น ห้ามมี business logic ห้ามเรียก Prisma
- **Service:** business logic ทั้งหมด ห้ามรู้จัก `req`/`res`
- **Repository:** ที่เดียวที่เรียก Prisma ได้ รวมถึง `$queryRaw`
- **ทุก query ของข้อมูลในทริปต้องมี `trip_id` กำกับเสมอ** ห้าม query ด้วย id อย่างเดียว
- ทุก route ใต้ `/api/trips/:tripId/...` ต้องผ่าน middleware `requireTripRole(...)`
- Timeline และ Summary เป็น read model คำนวณตอนอ่าน ห้ามสร้างตารางเก็บยอดรวมซ้ำ

Frontend:

- Server state ใช้ TanStack Query เท่านั้น ห้าม copy ลง Context/useState
- Context ใช้กับ auth และ UI state ข้ามหน้าเท่านั้น
- เรียก API ผ่าน `features/<domain>/api.js` ห้ามเรียก axios ตรงจาก component
- Component ที่เกิน ~200 บรรทัด ให้พิจารณาแตก

## 6. Convention

**Naming**

- DB: `snake_case` ตารางเป็นพหูพจน์ (`trip_members`)
- Prisma model: `PascalCase` เอกพจน์ + `@@map` / `@map` ไป snake_case
- JS: `camelCase`, React component `PascalCase.jsx`
- ไฟล์ backend: `<domain>.<layer>.js` เช่น `expenses.service.js`
- JSON ใน API: `camelCase`

**เงิน**

- DB เก็บ `DECIMAL(12,2)` ห้ามใช้ FLOAT
- API ส่งเป็น string เช่น `"350.00"` ห้ามบวกเลขเงินด้วย JS number ฝั่ง server ให้ใช้ SQL `SUM` หรือ `Prisma.Decimal`

**เวลา**

- เหตุการณ์ที่เกิดขึ้นจริง (`spent_at`, `occurred_at`) เก็บ UTC, API ส่ง ISO 8601
- แผนในอนาคต (`day_date`, `start_time`) เก็บเป็นเวลาท้องถิ่นของทริป ไม่แปลง timezone
- การจัดกลุ่ม "รายวัน" ใช้ `trips.timezone`

**Error**

- throw `AppError(code, httpStatus, message, details?)` จาก service
- มี error middleware ตัวเดียวแปลงเป็น response ห้าม `res.status(500)` กระจายตาม controller
- Express 5 ส่ง error จาก async handler ให้เอง ไม่ต้องครอบ `try/catch` หรือ wrapper ใน controller
- ห้ามส่ง stack trace หรือ Prisma error ดิบออกไปหา client

**Validation**

- ทุก endpoint ที่รับ input ต้องมี Zod schema ใน `<domain>.schema.js`
- validate ที่ middleware `validate({ body, query, params })` แล้วอ่านค่าจาก `req.valid.*` เท่านั้น

## 7. Security Checklist (ทุก feature)

- [ ] route ต้อง login หรือเปล่า และเช็ก role ของทริปแล้วหรือยัง
- [ ] input ผ่าน Zod ครบทุก field
- [ ] ไม่มี secret ในโค้ด ทุกอย่างมาจาก `.env` และมีตัวอย่างใน `.env.example`
- [ ] ไม่ส่ง `password_hash`, token hash, `storage_key` ออกไปใน response
- [ ] ไฟล์ upload ตรวจ mime จากเนื้อไฟล์จริง, จำกัดขนาด, ตั้งชื่อไฟล์ใหม่เอง
- [ ] ไม่ใช้ `dangerouslySetInnerHTML`
- [ ] ถ้าใช้ `$queryRaw` ต้องเป็น tagged template เท่านั้น ห้ามต่อ string

## 8. ขั้นตอนทำงานต่อ 1 feature

1. อ่าน spec ใน `docs/FEATURES.md` และ endpoint ใน `docs/API.md`
2. บอกแผนสั้น ๆ ก่อนลงมือ (ไฟล์ที่จะสร้าง/แก้)
3. Backend: schema/migration → repository → service → controller → route → test
4. Frontend: api → hooks → component → page ครบ Loading / Empty / Error state
5. รัน lint + test
6. ทดสอบบนจอกว้าง 375px
7. อัปเดตเอกสารที่เกี่ยวข้อง
8. commit แบบ Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`)

ทำทีละ feature ห้ามรวมหลาย feature ใน commit เดียว

## 9. ห้ามทำ

- ห้าม hard-code ข้อมูลทริป "Korat Rock Trip 2026" ลงโค้ด ใช้ได้แค่ใน seed สำหรับ dev
- ห้ามแก้ migration ที่ commit ไปแล้ว ให้สร้าง migration ใหม่
- ห้ามรัน `prisma migrate reset` หรือคำสั่งลบข้อมูลโดยไม่ถาม
- ห้ามสร้าง abstraction ล่วงหน้า (generic base repository, plugin system ฯลฯ)
- ห้ามทำ feature ของ phase ถัดไปก่อน phase ปัจจุบันผ่าน Definition of Done
- ห้าม commit `.env`, โฟลเดอร์ `uploads/`, หรือ key ใด ๆ

## 10. คำสั่งที่ใช้บ่อย

```bash
npm run dev:server          # API ที่ :3000
npm run dev:client          # เว็บที่ :5173 (proxy /api ไปที่ :3000)
npm run lint                # ทั้งสองฝั่ง
npm test                    # ทั้งสองฝั่ง
npm run format

cd server
npm run db:migrate -- --name <ชื่อ>   # หลังแก้ schema.prisma
npm run db:seed
```

รายละเอียดและวิธี deploy อยู่ที่ `docs/DEVELOPMENT.md`

## 11. ข้อจำกัดจากการรันบน Vercel

- `server/src/app.js` ต้อง `export default app` และห้ามเรียก `listen` ในไฟล์นี้ (ตัวที่ listen คือ `src/main.js`)
- ห้ามเขียนไฟล์ลงดิสก์ใน production และห้ามเก็บ state ไว้ในตัวแปรระดับ module โดยหวังว่าจะอยู่ข้าม request
- ห้ามใช้ `express.static()`
- client ต้องเรียก API ด้วย path `/api/...` เท่านั้น ห้ามใส่โดเมนของ server ตรง ๆ
