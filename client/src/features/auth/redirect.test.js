import { describe, expect, it } from 'vitest';

import { loginPathFor, safeNextPath } from './redirect.js';

describe('safeNextPath', () => {
  it('รับ path ภายในแอป', () => {
    expect(safeNextPath('/trips/12?tab=expenses')).toBe('/trips/12?tab=expenses');
  });

  it('ไม่พาไปโดเมนอื่น', () => {
    expect(safeNextPath('https://evil.example')).toBe('/');
    expect(safeNextPath('//evil.example')).toBe('/');
    expect(safeNextPath('/\\evil.example')).toBe('/');
    expect(safeNextPath(null)).toBe('/');
  });
});

describe('loginPathFor', () => {
  it('จำหน้าเดิมไว้ใน ?next=', () => {
    expect(loginPathFor({ pathname: '/trips/12', search: '?a=1', hash: '' })).toBe(
      '/login?next=%2Ftrips%2F12%3Fa%3D1',
    );
  });

  it('หน้าแรกไม่ต้องใส่ next', () => {
    expect(loginPathFor({ pathname: '/', search: '', hash: '' })).toBe('/login');
  });
});
