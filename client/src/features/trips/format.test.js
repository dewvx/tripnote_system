import { describe, expect, it } from 'vitest';

import { formatDateRange, formatMoney } from './format.js';

describe('formatDateRange', () => {
  it('เดือนเดียวกันย่อเป็นช่วงวัน', () => {
    expect(formatDateRange('2026-10-10', '2026-10-12')).toBe('10–12 ต.ค. 2569');
  });

  it('ข้ามเดือนแสดงทั้งสองฝั่ง', () => {
    expect(formatDateRange('2026-09-30', '2026-10-02')).toBe('30 ก.ย. – 2 ต.ค. 2569');
  });

  it('วันเดียวแสดงวันเดียว', () => {
    expect(formatDateRange('2026-10-10', '2026-10-10')).toBe('10 ต.ค. 2569');
  });
});

describe('formatMoney', () => {
  it('ใส่จุลภาคและตัด .00 ทิ้ง', () => {
    expect(formatMoney('7000.00')).toBe('7,000 บาท');
    expect(formatMoney('1234567.50')).toBe('1,234,567.50 บาท');
  });

  it('ไม่มีค่าคืน null', () => {
    expect(formatMoney(null)).toBeNull();
  });
});
