import { Prisma } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { settle, splitEqually } from '../src/modules/expenses/expenses.settlement.js';

const member = (memberId, paid) => ({ memberId, displayName: `M${memberId}`, paid });

const sum = (values) =>
  values.reduce((acc, value) => acc.plus(value), new Prisma.Decimal(0)).toFixed(2);

describe('splitEqually', () => {
  it('ตัวอย่างใน API.md: 2 คน รวม 2350 คนแรกได้คืน 625', () => {
    const result = splitEqually([member(30, '1800.00'), member(31, '550.00')], '2350.00');

    expect(result).toEqual([
      { memberId: 30, displayName: 'M30', paid: '1800.00', share: '1175.00', balance: '625.00' },
      { memberId: 31, displayName: 'M31', paid: '550.00', share: '1175.00', balance: '-625.00' },
    ]);
  });

  it('เศษสตางค์ลงที่คนแรก ผลรวม share เท่ายอดรวม ผลรวม balance เป็นศูนย์', () => {
    // 100.01 / 3 = 33.33 เศษ 2 สตางค์ → คนแรก 33.35
    const result = splitEqually(
      [member(1, '0.00'), member(2, '100.01'), member(3, '0.00')],
      '100.01',
    );

    expect(result.map((m) => m.share)).toEqual(['33.35', '33.33', '33.33']);
    expect(sum(result.map((m) => m.share))).toBe('100.01');
    expect(sum(result.map((m) => m.balance))).toBe('0.00');
  });

  it.each([
    ['0.01', 3],
    ['0.02', 3],
    ['10.00', 3],
    ['999999.99', 7],
    ['1.00', 6],
  ])('ยอด %s หาร %i คน ผลรวมลงตัวทุกสตางค์', (total, count) => {
    const members = Array.from({ length: count }, (_, i) => member(i + 1, i === 0 ? total : '0'));
    const result = splitEqually(members, total);

    expect(sum(result.map((m) => m.share))).toBe(new Prisma.Decimal(total).toFixed(2));
    expect(sum(result.map((m) => m.balance))).toBe('0.00');
  });

  it('ยังไม่มีรายจ่าย ทุกคน 0.00', () => {
    expect(splitEqually([member(1, '0'), member(2, '0')], '0').map((m) => m.balance)).toEqual([
      '0.00',
      '0.00',
    ]);
  });
});

describe('settle', () => {
  const balances = (pairs) => pairs.map(([memberId, balance]) => ({ memberId, balance }));

  it('สองคน: คนติดลบโอนให้คนที่ควรได้คืน', () => {
    expect(
      settle(
        balances([
          [30, '625.00'],
          [31, '-625.00'],
        ]),
      ),
    ).toEqual([{ fromMemberId: 31, toMemberId: 30, amount: '625.00' }]);
  });

  it('ลงตัวแล้วไม่ต้องโอน', () => {
    expect(
      settle(
        balances([
          [1, '0.00'],
          [2, '0.00'],
        ]),
      ),
    ).toEqual([]);
  });

  it('หลายคน โอนไม่เกิน n−1 ครั้ง และหลังโอนทุกคนเป็นศูนย์', () => {
    const input = balances([
      [1, '-33.35'],
      [2, '66.68'],
      [3, '-33.33'],
      [4, '50.00'],
      [5, '-50.00'],
    ]);
    const result = settle(input);

    expect(result.length).toBeLessThanOrEqual(input.length - 1);
    const after = new Map(input.map((m) => [m.memberId, new Prisma.Decimal(m.balance)]));
    for (const { fromMemberId, toMemberId, amount } of result) {
      after.set(fromMemberId, after.get(fromMemberId).plus(amount));
      after.set(toMemberId, after.get(toMemberId).minus(amount));
    }
    expect([...after.values()].every((v) => v.isZero())).toBe(true);
  });

  it('ยอดเท่ากันเรียงตามลำดับสมาชิก ผลเหมือนเดิมทุกครั้ง', () => {
    expect(
      settle(
        balances([
          [1, '10.00'],
          [2, '10.00'],
          [3, '-20.00'],
        ]),
      ),
    ).toEqual([
      { fromMemberId: 3, toMemberId: 1, amount: '10.00' },
      { fromMemberId: 3, toMemberId: 2, amount: '10.00' },
    ]);
  });
});
