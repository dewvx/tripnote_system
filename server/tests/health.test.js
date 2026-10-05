import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// mock ชั้น repository เพื่อให้ test นี้ไม่ต้องมีฐานข้อมูลจริง
vi.mock('../src/modules/health/health.repository.js', () => ({
  pingDatabase: vi.fn(),
}));

const { pingDatabase } = await import('../src/modules/health/health.repository.js');
const { default: app } = await import('../src/app.js');

describe('GET /api/health', () => {
  beforeEach(() => {
    pingDatabase.mockReset();
  });

  it('ตอบ ok เมื่อฐานข้อมูลเชื่อมต่อได้', async () => {
    pingDatabase.mockResolvedValue();

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'ok', database: 'up' });
    expect(Number.isNaN(Date.parse(res.body.data.time))).toBe(false);
  });

  it('ตอบ degraded เมื่อฐานข้อมูลล่ม โดย API ยังไม่พัง', async () => {
    pingDatabase.mockRejectedValue(new Error('connection refused'));

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'degraded', database: 'down' });
  });
});
