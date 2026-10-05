import * as healthRepository from './health.repository.js';

// Service ไม่รู้จัก req/res รับค่าเข้า คืนค่าออก
export async function getHealth() {
  let database = 'up';
  try {
    await healthRepository.pingDatabase();
  } catch {
    database = 'down';
  }

  return {
    status: database === 'up' ? 'ok' : 'degraded',
    database,
    time: new Date().toISOString(),
  };
}
