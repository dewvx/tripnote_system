import { describe, expect, it } from 'vitest';

import { parseAmountInput } from './amount.js';

describe('parseAmountInput', () => {
  it.each([
    ['50', '50'],
    ['1,250.5', '1250.5'],
    [' 99.99 ', '99.99'],
    ['20.', '20'],
  ])('%j → %j', (raw, amount) => {
    expect(parseAmountInput(raw)).toEqual({ amount });
  });

  it.each([
    ['', 'กรุณาใส่จำนวนเงิน'],
    ['0', 'จำนวนเงินต้องมากกว่า 0'],
    ['0.00', 'จำนวนเงินต้องมากกว่า 0'],
    ['-5', 'จำนวนเงินต้องเป็นตัวเลข ทศนิยมไม่เกิน 2 ตำแหน่ง'],
    ['1.234', 'จำนวนเงินต้องเป็นตัวเลข ทศนิยมไม่เกิน 2 ตำแหน่ง'],
    ['abc', 'จำนวนเงินต้องเป็นตัวเลข ทศนิยมไม่เกิน 2 ตำแหน่ง'],
  ])('%j ไม่ผ่าน: %s', (raw, error) => {
    expect(parseAmountInput(raw)).toEqual({ error });
  });
});
