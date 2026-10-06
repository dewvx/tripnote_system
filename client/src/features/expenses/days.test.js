import { describe, expect, it } from 'vitest';

import { dayKey, groupByDay, tripDayNumber } from './days.js';

describe('dayKey', () => {
  it('แบ่งวันตาม timezone ของทริป ไม่ใช่ UTC', () => {
    // 16:59 UTC = 23:59 เวลาไทย, 17:00 UTC = เที่ยงคืนของวันถัดไป
    expect(dayKey('2026-10-10T16:59:00Z', 'Asia/Bangkok')).toBe('2026-10-10');
    expect(dayKey('2026-10-10T17:00:00Z', 'Asia/Bangkok')).toBe('2026-10-11');
    expect(dayKey('2026-10-10T17:00:00Z', 'UTC')).toBe('2026-10-10');
  });
});

describe('groupByDay', () => {
  it('รวมรายการติดกันที่วันเดียวกัน คงลำดับเดิม', () => {
    const expenses = [
      { id: 3, spentAt: '2026-10-11T02:00:00Z' },
      { id: 2, spentAt: '2026-10-10T20:00:00Z' },
      { id: 1, spentAt: '2026-10-10T05:00:00Z' },
    ];

    expect(groupByDay(expenses, 'Asia/Bangkok')).toEqual([
      { date: '2026-10-11', expenses: [expenses[0], expenses[1]] },
      { date: '2026-10-10', expenses: [expenses[2]] },
    ]);
  });

  it('ไม่มีรายการ ได้ []', () => {
    expect(groupByDay([], 'Asia/Bangkok')).toEqual([]);
  });
});

describe('tripDayNumber', () => {
  it.each([
    ['2026-10-10', 1],
    ['2026-10-12', 3],
    ['2026-10-09', null],
    ['2026-10-13', null],
  ])('%s → %s', (date, expected) => {
    expect(tripDayNumber(date, '2026-10-10', '2026-10-12')).toBe(expected);
  });
});
