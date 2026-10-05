# Development Guide

วิธีรันโปรเจกต์ตั้งแต่ clone จนถึง deploy

## 1. สิ่งที่ต้องมี

| เครื่องมือ     | เวอร์ชัน  | ใช้ทำอะไร                                                            |
| -------------- | --------- | -------------------------------------------------------------------- |
| Node.js        | 22 ขึ้นไป | รัน client และ server (ใช้ `--env-file` และ `--watch` ที่มากับ Node) |
| Docker Desktop | ล่าสุด    | รัน MySQL ตอน dev                                                    |
| Git            | ล่าสุด    |                                                                      |

ถ้าไม่อยากใช้ Docker ใช้ MySQL 8 ที่ติดตั้งในเครื่อง (เช่น XAMPP, MySQL Installer) ได้ แค่แก้ `DATABASE_URL` ให้ตรง
ผู้ใช้ที่ใส่ใน URL ต้องมีสิทธิ์สร้าง database เพราะ `prisma migrate dev` ต้องสร้าง shadow database ชั่วคราว

## 2. ติดตั้งครั้งแรก

```bash
# 1) ติดตั้ง dependency ทั้งสองฝั่ง
npm install
npm run setup

# 2) สร้างไฟล์ env จากตัวอย่าง
cp server/.env.example server/.env
cp client/.env.example client/.env

# 3) เปิด MySQL
docker compose up -d
```

`npm run setup` จะรัน `prisma generate` ให้ฝั่ง server อัตโนมัติ (ผ่าน `postinstall`)

## 3. สร้างฐานข้อมูลครั้งแรก

migration ทั้งหมดอยู่ใน `server/prisma/migrations/` แล้ว ฐานใหม่รันแค่นี้

```bash
cd server
npx prisma migrate deploy   # สร้างตารางและ CHECK constraint ทั้งหมด
npm run db:seed             # ใส่ข้อมูลตั้งต้น (หมวดค่าใช้จ่าย)
```

**เพิ่ม CHECK constraint ใหม่:** Prisma schema ประกาศ CHECK ไม่ได้ ให้สร้าง migration เปล่าด้วย
`npx prisma migrate dev --name <ชื่อ> --create-only` แล้วเขียน `ALTER TABLE ... ADD CONSTRAINT ... CHECK (...)` เอง
ตัวอย่างอยู่ที่ migration `20261006120000_add_check_constraints`

## 4. รันตอนพัฒนา

เปิดสอง terminal ที่ root ของโปรเจกต์

```bash
npm run dev:server     # API ที่ http://localhost:3000/api
npm run dev:client     # เว็บที่ http://localhost:5173
```

เปิด http://localhost:5173 ควรเห็นหน้า "สถานะระบบ" ขึ้นว่า API และฐานข้อมูลพร้อมใช้งาน

Vite ส่งต่อทุก request ที่ขึ้นต้นด้วย `/api` ไปที่ Express ให้ เบราว์เซอร์จึงเห็นเป็น origin เดียวกัน
ซึ่งเป็นสภาพเดียวกับ production และเป็นเหตุผลที่ตอน dev ไม่ต้องตั้ง CORS

ทดสอบบนมือถือจริงในวง Wi-Fi เดียวกัน: รัน `npm --prefix client run dev -- --host` แล้วเปิด IP ที่ Vite แสดง

## 5. คำสั่งทั้งหมด

ที่ root

| คำสั่ง                              | ทำอะไร                                   |
| ----------------------------------- | ---------------------------------------- |
| `npm run setup`                     | ติดตั้ง dependency ของ server และ client |
| `npm run dev:server` / `dev:client` | รันแต่ละฝั่งแบบ reload อัตโนมัติ         |
| `npm run lint`                      | ESLint ทั้งสองฝั่ง                       |
| `npm test`                          | test ทั้งสองฝั่ง                         |
| `npm run format`                    | จัดรูปแบบโค้ดด้วย Prettier               |

ใน `server/`

| คำสั่ง                                | ทำอะไร                                            |
| ------------------------------------- | ------------------------------------------------- |
| `npm run db:migrate -- --name <ชื่อ>` | สร้างและรัน migration ใหม่หลังแก้ `schema.prisma` |
| `npm run db:deploy`                   | รัน migration ที่ค้างอยู่ (ใช้กับ production)     |
| `npm run db:seed`                     | ใส่ข้อมูลตั้งต้น รันซ้ำได้                        |
| `npm run db:studio`                   | เปิดหน้าเว็บดูและแก้ข้อมูลในตาราง                 |

## 6. Prisma ฉบับคนใช้ SQL มาก่อน

| สิ่งที่เคยทำ                         | ทำด้วย Prisma                                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| เขียน `CREATE TABLE` / `ALTER TABLE` | แก้ `prisma/schema.prisma` แล้วรัน `npm run db:migrate -- --name <ชื่อ>` Prisma เขียน SQL และรันให้ |
| เปิด phpMyAdmin ดูข้อมูล             | `npm run db:studio`                                                                                 |
| `SELECT * FROM trips WHERE id = ?`   | `prisma.trip.findUnique({ where: { id } })`                                                         |
| `SELECT ... WHERE ... ORDER BY ...`  | `prisma.expense.findMany({ where: {...}, orderBy: {...} })`                                         |
| `INSERT`                             | `prisma.expense.create({ data: {...} })`                                                            |
| `UPDATE ... WHERE id = ?`            | `prisma.expense.update({ where: { id }, data: {...} })`                                             |
| `JOIN`                               | `include: { category: true }` หรือ `select` เฉพาะ field ที่ต้องการ                                  |
| `BEGIN ... COMMIT`                   | `prisma.$transaction(async (tx) => { ... })`                                                        |
| query ซับซ้อน `GROUP BY`, `SUM`      | เขียน SQL ตรง ๆ ด้วย `` prisma.$queryRaw`...` ``                                                    |

ข้อที่ต้องจำ

- แก้ `schema.prisma` แล้วต้อง migrate ทุกครั้ง ไม่อย่างนั้นโค้ดกับฐานข้อมูลจะไม่ตรงกัน
- ห้ามแก้ไฟล์ migration ที่ commit ไปแล้ว ให้สร้างอันใหม่
- ค่าเงินที่อ่านจาก Prisma เป็น object ชนิด `Decimal` ไม่ใช่ number ให้ `.toFixed(2)` ก่อนส่งออก API
- `$queryRaw` ต้องเขียนเป็น template literal ติดกับชื่อฟังก์ชันเท่านั้น ตัวแปรที่แทรกด้วย `${}` จะถูกส่งเป็น parameter อย่างปลอดภัย ห้ามต่อ string เอง
- เรียก Prisma ได้เฉพาะในไฟล์ `*.repository.js`

## 7. โครงของ feature ฝั่ง server

`src/modules/health/` เป็นตัวอย่างอ้างอิงที่เล็กที่สุดของรูปแบบที่ทุก module ต้องทำตาม

```
health.routes.js       ผูก path กับ controller และ middleware
health.controller.js   req → service → res
health.service.js      logic ไม่รู้จัก req/res
health.repository.js   ที่เดียวที่เรียก Prisma
```

module จริงจะมี `<domain>.schema.js` สำหรับ Zod schema เพิ่มอีกไฟล์ และใช้กับ middleware `validate()`
โดยค่าที่ผ่านการตรวจแล้วอยู่ที่ `req.valid.body`, `req.valid.query`, `req.valid.params`

Express 5 ส่ง error จาก async handler ไปที่ `errorHandler` ให้เอง จึงไม่ต้องครอบ `try/catch` ใน controller

## 8. Deploy

ใช้ Vercel สอง project จาก repo เดียว และ MySQL แบบ managed

```
เบราว์เซอร์ ──► client project (เว็บ)
                   │  rewrite /api/*
                   ▼
               server project (Express เป็น function) ──► MySQL
```

เบราว์เซอร์คุยกับโดเมนของ client อย่างเดียว cookie จึงเป็น first-party

### 8.1 ฐานข้อมูล

1. สร้าง MySQL บนผู้ให้บริการที่เลือก (ตัวเลือกแรก: Aiven free tier) เลือก region ใกล้ผู้ใช้
2. คัดลอก connection string มาแปลงเป็นรูปแบบของ Prisma: `mysql://USER:PASSWORD@HOST:PORT/DATABASE?connection_limit=5`
   ถ้าผู้ให้บริการบังคับ SSL ให้เพิ่ม `&sslaccept=strict` (พารามิเตอร์ `ssl-mode` ของ MySQL client ใช้กับ Prisma ไม่ได้)
3. รัน migration และ seed จากเครื่อง dev โดยชี้ไปที่ฐานข้อมูลจริงชั่วคราว

```bash
cd server
DATABASE_URL="<url ของ production>" npx prisma migrate deploy
DATABASE_URL="<url ของ production>" node prisma/seed.js
```

บน Windows PowerShell ให้ตั้งตัวแปรก่อน: `$env:DATABASE_URL="<url>"` แล้วค่อยรันคำสั่ง

### 8.2 Server project

1. Vercel → Add New Project → เลือก repo → **Root Directory: `server`**
2. Framework Preset ควรถูกตรวจเจอเป็น Express (Vercel หา default export จาก `src/app.js`)
3. Environment Variables: `NODE_ENV=production`, `DATABASE_URL=<url ของ production>`,
   `JWT_ACCESS_SECRET=<ค่าสุ่มยาว ≥ 32 ตัว ห้ามใช้ค่าเดียวกับ dev>` (เพิ่มใน F1.2 ถ้าไม่ตั้ง function จะพังตั้งแต่ตอนเริ่ม)
   สร้างค่าด้วย `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
4. Deploy แล้วเปิด `https://<server-project>.vercel.app/api/health` ต้องได้ `"database":"up"`

### 8.3 Client project

1. แก้ `client/vercel.json` ใส่โดเมนของ server project แทน `REPLACE-WITH-YOUR-API-PROJECT` แล้ว commit
2. Vercel → Add New Project → repo เดิม → **Root Directory: `client`** (Framework Preset: Vite)
3. Environment Variables: `VITE_API_BASE_URL=/api`
4. Deploy แล้วเปิดเว็บ หน้าสถานะระบบต้องขึ้นว่าพร้อมใช้งานทั้งสองบรรทัด

### 8.4 บันทึกจากการ deploy จริงครั้งแรก (5 ต.ค. 2026)

Deploy ผ่านครบทั้งสองฝั่งแล้ว มี 3 จุดที่ต่างจากแผนเดิม:

- **ต้องเพิ่ม `server/vercel.json`** เพื่อสั่งให้ Vercel รวม `prisma/ca.pem` เข้าไปใน
  function bundle เพราะไฟล์นี้ถูกอ้างถึงผ่าน string ใน `DATABASE_URL`
  (ไม่ใช่ `import`/`require`) ตัว file-tracer ของ Vercel เลยไม่เห็นมันโดยอัตโนมัติ
  ถ้าไม่มีไฟล์นี้ ฐานข้อมูลจะต่อไม่ติด (`/api/health` ขึ้น `database: down`)
  โดยไม่มี error อื่นให้เห็นนอกจาก Runtime Logs

```json
{
  "functions": { "src/app.js": { "includeFiles": "prisma/ca.pem" } }
}
```

- **ตั้งชื่อ 2 project บน Vercel ต้องไม่ซ้ำกัน** ไม่งั้น Vercel จะเติมเลขสุ่มต่อท้ายชื่อที่ซ้ำ
  ทำให้โดเมนไม่ตรงกับที่วางแผน (ของจริง: server = `tripnote-system`, client = `tripnote-client`)
- `npm warn install-scripts` และ Node engines warning ที่ขึ้นตอน build ไม่กระทบผลลัพธ์
  เป็นคำเตือนเฉยๆ ปล่อยผ่านได้

โดเมน production: client `https://tripnote-client.vercel.app`, server `https://tripnote-system.vercel.app`

## 9. ปัญหาที่เจอบ่อย

| อาการ                                              | สาเหตุและวิธีแก้                                                                           |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `@prisma/client did not initialize yet`            | ยังไม่ได้ generate ให้รัน `npx prisma generate` ใน `server/`                               |
| `Environment variables ไม่ถูกต้อง` ตอนเริ่ม server | ไม่มี `server/.env` หรือค่าขาด เทียบกับ `.env.example`                                     |
| หน้าเว็บขึ้น "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้"          | ยังไม่ได้รัน `npm run dev:server` หรือ port ไม่ตรงกับ `DEV_API_TARGET`                     |
| ฐานข้อมูลขึ้น "เชื่อมต่อไม่ได้"                    | MySQL ยังไม่ขึ้น (`docker compose ps`) หรือ `DATABASE_URL` ผิด                             |
| `P3014` ตอน `migrate dev`                          | ผู้ใช้ฐานข้อมูลไม่มีสิทธิ์สร้าง shadow database ใช้ root ตอน dev                           |
| port 3306 ถูกใช้อยู่                               | มี MySQL ตัวอื่นรันอยู่ ปิดตัวนั้น หรือแก้ port ใน `docker-compose.yml` และ `DATABASE_URL` |
