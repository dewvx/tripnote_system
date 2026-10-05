import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

vi.mock('../src/modules/health/health.repository.js', () => ({
  pingDatabase: vi.fn(),
}));

const { default: app } = await import('../src/app.js');
const { AppError } = await import('../src/lib/AppError.js');
const { errorHandler } = await import('../src/middlewares/errorHandler.js');
const { validate } = await import('../src/middlewares/validate.js');

// แอปจำลองเล็ก ๆ สำหรับทดสอบ middleware โดยไม่ผูกกับ route จริง
function buildTestApp() {
  const testApp = express();
  testApp.use(express.json());

  testApp.post(
    '/echo',
    validate({
      body: z.object({ amount: z.coerce.number().positive(), note: z.string().optional() }),
    }),
    (req, res) => res.json({ data: req.valid.body }),
  );
  testApp.get('/known', () => {
    throw new AppError('TRIP_NOT_FOUND', 404, 'ไม่พบทริป');
  });
  testApp.get('/unknown', async () => {
    throw new Error('secret internal detail');
  });

  testApp.use(errorHandler);
  return testApp;
}

describe('รูปแบบ error ของ API', () => {
  it('route ที่ไม่มี ตอบ 404 ในรูปแบบมาตรฐาน', async () => {
    const res = await request(app).get('/api/nope');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('JSON พัง ตอบ 400 ไม่ใช่ 500', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{ not json');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('ไม่มี header x-powered-by และมี security header จาก helmet', async () => {
    const res = await request(app).get('/api/health');

    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('AppError ถูกแปลงตาม code และ status ที่กำหนด', async () => {
    const res = await request(buildTestApp()).get('/known');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'TRIP_NOT_FOUND', message: 'ไม่พบทริป' } });
  });

  it('error ที่ไม่คาดคิดจาก async handler ตอบ 500 และไม่หลุดรายละเอียดภายใน', async () => {
    const res = await request(buildTestApp()).get('/unknown');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });
});

describe('validate middleware', () => {
  it('ส่งค่าที่แปลงชนิดแล้วไปที่ req.valid', async () => {
    const res = await request(buildTestApp()).post('/echo').send({ amount: '50.5', extra: 'x' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ amount: 50.5 });
  });

  it('ตอบ 422 พร้อมชื่อ field ที่ผิด', async () => {
    const res = await request(buildTestApp()).post('/echo').send({ amount: -1 });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].field).toBe('amount');
  });
});
