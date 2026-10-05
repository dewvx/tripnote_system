import { describe, expect, it } from 'vitest';

import { daysBetween, groupTrips, todayIn, tripProgress } from './dashboard.js';

const trip = (fields) => ({
  status: 'planning',
  startDate: '2026-10-10',
  endDate: '2026-10-12',
  dayCount: 3,
  timezone: 'Asia/Bangkok',
  ...fields,
});

describe('todayIn', () => {
  it('ใช้วันตาม timezone ของทริป ไม่ใช่ของเครื่อง', () => {
    // 18:30 UTC วันที่ 9 = 01:30 วันที่ 10 ที่กรุงเทพฯ
    const now = new Date('2026-10-09T18:30:00Z');
    expect(todayIn('Asia/Bangkok', now)).toBe('2026-10-10');
    expect(todayIn('UTC', now)).toBe('2026-10-09');
  });
});

describe('daysBetween', () => {
  it('นับข้ามเดือนและติดลบได้', () => {
    expect(daysBetween('2026-09-30', '2026-10-02')).toBe(2);
    expect(daysBetween('2026-10-02', '2026-09-30')).toBe(-2);
  });
});

describe('groupTrips', () => {
  it('แบ่งตามสถานะ กำลังจะถึงเรียงใกล้สุดก่อน ที่ผ่านมาเรียงล่าสุดก่อน', () => {
    const trips = [
      trip({ id: 1, status: 'planning', startDate: '2026-12-01' }),
      trip({ id: 2, status: 'active' }),
      trip({ id: 3, status: 'planning', startDate: '2026-11-01' }),
      trip({ id: 4, status: 'completed', endDate: '2026-05-01' }),
      trip({ id: 5, status: 'cancelled', endDate: '2026-08-01' }),
    ];

    const groups = groupTrips(trips);

    expect(groups.active.map((t) => t.id)).toEqual([2]);
    expect(groups.upcoming.map((t) => t.id)).toEqual([3, 1]);
    expect(groups.past.map((t) => t.id)).toEqual([5, 4]);
  });
});

describe('tripProgress', () => {
  it('ทริปที่ยังไม่เริ่ม นับถอยหลัง', () => {
    expect(tripProgress(trip(), '2026-10-06').text).toBe('อีก 4 วัน');
    expect(tripProgress(trip(), '2026-10-09').text).toBe('พรุ่งนี้');
    expect(tripProgress(trip(), '2026-10-10').text).toBe('วันนี้');
    expect(tripProgress(trip(), '2026-10-11').tone).toBe('attention');
  });

  it('ทริปที่กำลังเดินทาง บอกวันที่เท่าไหร่ของทริป', () => {
    const active = trip({ status: 'active' });
    expect(tripProgress(active, '2026-10-10').text).toBe('วันที่ 1 จาก 3');
    expect(tripProgress(active, '2026-10-12').text).toBe('วันที่ 3 จาก 3');
    expect(tripProgress(active, '2026-10-13').tone).toBe('attention');
    expect(tripProgress(active, '2026-10-09').text).toBe('ออกเดินทางก่อนกำหนด 1 วัน');
  });

  it('ทริปที่จบแล้วไม่มีข้อความความคืบหน้า', () => {
    expect(tripProgress(trip({ status: 'completed' }), '2026-10-20')).toBeNull();
  });
});
