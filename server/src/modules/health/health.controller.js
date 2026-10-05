import * as healthService from './health.service.js';

// Controller: รับ request → เรียก service → ส่ง response เท่านั้น
export async function getHealth(_req, res) {
  const health = await healthService.getHealth();
  res.json({ data: health });
}
