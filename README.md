# TripNote

> ชื่อชั่วคราว

Web app สำหรับจัดการทริปตั้งแต่ก่อนออกเดินทางจนกลับถึงบ้าน
รวม **Trip Planner + Expense Tracker + Travel Journal** ไว้ในที่เดียว

```
Planning  →  Traveling  →  Recording  →  Reviewing
วางแผน        เดินทาง        บันทึก         ย้อนดู
```

ออกแบบแบบ Mobile First เพราะใช้จริงตอนอยู่ระหว่างทาง

## สถานะ

🟡 **กำลังพัฒนา v0.1** โครงโปรเจกต์พร้อมแล้ว งานถัดไปคือระบบ login

## ทำอะไรได้ (เมื่อเสร็จ)

- สร้างทริป กำหนดวัน งบ และคนร่วมทริป (คนร่วมทริปไม่ต้องมีบัญชีก็ได้)
- วางแผนรายวัน: สถานที่ เวลา การเดินทาง โน้ต
- จดค่าใช้จ่ายเร็ว ๆ ดูงบคงเหลือ ดูว่าใครจ่ายไปเท่าไหร่ ใครต้องคืนใคร
- บันทึกความทรงจำ: เช็กอินสถานที่ โน้ต รูป คะแนน
- Timeline รวมทุกอย่างเรียงตามเวลา
- สรุปทริป: ค่าใช้จ่ายรวม เฉลี่ยต่อคน สัดส่วนตามหมวด สถานที่ที่ไป

## Tech Stack

| ส่วน     | เทคโนโลยี                                                                  |
| -------- | -------------------------------------------------------------------------- |
| Frontend | React, Vite, JavaScript, Tailwind CSS, React Router, Axios, TanStack Query |
| Backend  | Node.js 22, Express 5, REST API, JWT, bcrypt, Zod                          |
| Database | MySQL 8 + Prisma 6                                                         |
| File     | multer + sharp, เก็บ local ตอน dev / object storage ตอน production         |
| Test     | Vitest, Supertest                                                          |

เหตุผลของแต่ละตัวอยู่ใน [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## โครงสร้าง repo

```
.
├── client/          React app
├── server/          Express API
├── docs/            เอกสารทั้งหมด
├── AGENTS.md        กติกาสำหรับ AI agent
├── CLAUDE.md        ชี้ไปที่ AGENTS.md
└── README.md
```

## เอกสาร

- [Project Overview](docs/PROJECT_OVERVIEW.md) — วิสัยทัศน์ ขอบเขต การวิเคราะห์ requirement
- [Architecture](docs/ARCHITECTURE.md) — โครงสร้างระบบ การตัดสินใจทางเทคนิค
- [Database](docs/DATABASE.md) — ERD ตาราง ความสัมพันธ์ index
- [API](docs/API.md) — endpoint ทั้งหมด
- [Features](docs/FEATURES.md) — feature แต่ละ phase และ UX spec
- [Roadmap](docs/ROADMAP.md) — ลำดับการพัฒนา

- [Development](docs/DEVELOPMENT.md) — วิธีรัน คำสั่ง deploy และ Prisma เบื้องต้น

## เริ่มใช้งาน

ต้องมี Node.js 22+ และ Docker

```bash
npm install && npm run setup
cp server/.env.example server/.env
cp client/.env.example client/.env
docker compose up -d
```

จากนั้นสร้างฐานข้อมูลครั้งแรกตาม [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) หัวข้อ 3 แล้วรัน

```bash
npm run dev:server
npm run dev:client
```

เปิด http://localhost:5173

## License

ยังไม่กำหนด
