import { describe, expect, it } from 'vitest';

import { budgetBarPercent, budgetLevel } from './budget.js';

const summary = (budgetAmount, remaining, budgetUsedPercent) => ({
  budgetAmount,
  remaining,
  budgetUsedPercent,
});

describe('budgetLevel', () => {
  it.each([
    [summary(null, null, null), 'none'],
    [summary('1000.00', '1000.00', 0), 'ok'],
    [summary('1000.00', '200.00', 80), 'ok'],
    [summary('1000.00', '199.90', 80.1), 'warning'],
    [summary('1000.00', '0.00', 100), 'warning'],
    [summary('1000.00', '-0.01', 100), 'over'],
    [summary('0.00', '-5.00', null), 'over'],
    [summary('0.00', '0.00', null), 'ok'],
  ])('%j → %s', (input, level) => {
    expect(budgetLevel(input)).toBe(level);
  });
});

describe('budgetBarPercent', () => {
  it('ไม่เกิน 100 และเกินงบแล้วเต็มแถบ', () => {
    expect(budgetBarPercent(summary('1000.00', '664.00', 33.6))).toBe(33.6);
    expect(budgetBarPercent(summary('100.00', '-50.00', 150))).toBe(100);
    expect(budgetBarPercent(summary('0.00', '-5.00', null))).toBe(100);
    expect(budgetBarPercent(summary(null, null, null))).toBe(0);
  });
});
