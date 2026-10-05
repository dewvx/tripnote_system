import { describe, expect, it } from 'vitest';

import { toApiError } from './axios.js';

describe('toApiError', () => {
  it('ใช้ error จาก API เมื่อมี', () => {
    const result = toApiError({
      response: { status: 422, data: { error: { code: 'VALIDATION_ERROR', message: 'ผิด' } } },
    });
    expect(result).toEqual({ code: 'VALIDATION_ERROR', message: 'ผิด', status: 422 });
  });

  it('แยก timeout ออกจาก network error', () => {
    expect(toApiError({ code: 'ECONNABORTED' }).code).toBe('TIMEOUT');
    expect(toApiError({}).code).toBe('NETWORK_ERROR');
  });
});
