import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import apiRoutes from './routes/index.js';

// ไฟล์นี้สร้างและ export แอปเท่านั้น ไม่เปิด port
// - dev / VPS: src/main.js เป็นคนเรียก listen
// - Vercel: ระบบหา default export จากไฟล์นี้แล้วรันเป็น function ให้เอง
const app = express();

app.disable('x-powered-by');

// อยู่หลัง proxy ของ Vercel 1 ชั้น ต้องเชื่อ header X-Forwarded-* เพื่อให้ req.ip และ req.secure ถูก
if (env.isProduction) {
  app.set('trust proxy', 1);
}

app.use(helmet());

// ปกติ client เรียกผ่าน proxy/rewrite จึงเป็น same origin และไม่ต้องใช้ CORS
// เปิดเฉพาะเมื่อกำหนด CORS_ORIGIN ไว้
if (env.CORS_ORIGIN.length > 0) {
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
}

app.use(express.json({ limit: '100kb' }));
// ใช้อ่าน refresh cookie ที่ /api/auth/*
app.use(cookieParser());

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
