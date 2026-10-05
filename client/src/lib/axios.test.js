import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api, setAccessToken, setSessionExpiredHandler, toApiError } from './axios.js';

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

// server จำลอง: access token ที่ใช้ได้คือ 'fresh' เท่านั้น
function respond(config, status, data) {
  const response = { status, data, headers: {}, config, statusText: '' };
  if (status < 400) return Promise.resolve(response);
  return Promise.reject(new AxiosError('fail', 'ERR_BAD_RESPONSE', config, null, response));
}

describe('ต่ออายุ token อัตโนมัติ', () => {
  let refreshResult;
  let refreshCalls;
  let onExpired;

  beforeEach(() => {
    refreshCalls = 0;
    refreshResult = 'ok';
    onExpired = vi.fn();
    setSessionExpiredHandler(onExpired);
    setAccessToken('stale');

    api.defaults.adapter = async (config) => {
      if (config.url === '/auth/refresh') {
        refreshCalls += 1;
        await new Promise((r) => setTimeout(r, 10));
        if (refreshResult === 'network') throw new AxiosError('offline', 'ERR_NETWORK', config);
        if (refreshResult === 'expired') {
          return respond(config, 401, { error: { code: 'UNAUTHENTICATED', message: 'x' } });
        }
        return respond(config, 200, { data: { accessToken: 'fresh', user: { id: 1 } } });
      }
      if (config.headers.Authorization === 'Bearer fresh') {
        return respond(config, 200, { data: config.url });
      }
      return respond(config, 401, { error: { code: 'TOKEN_EXPIRED', message: 'x' } });
    };
  });

  it('เจอ 401 แล้ว refresh และยิงคำขอเดิมซ้ำ', async () => {
    const { data } = await api.get('/trips');

    expect(data.data).toBe('/trips');
    expect(refreshCalls).toBe(1);
  });

  it('หลายคำขอหมดอายุพร้อมกัน refresh แค่ครั้งเดียว', async () => {
    const results = await Promise.all([api.get('/a'), api.get('/b'), api.get('/c')]);

    expect(results.map((r) => r.data.data)).toEqual(['/a', '/b', '/c']);
    expect(refreshCalls).toBe(1);
  });

  it('refresh ไม่ผ่านเพราะเซสชันหมด เรียก handler ให้กลับหน้า login', async () => {
    refreshResult = 'expired';

    await expect(api.get('/trips')).rejects.toMatchObject({ status: 401 });
    expect(onExpired).toHaveBeenCalledOnce();
  });

  it('refresh ไม่ผ่านเพราะเน็ตหลุด ไม่เด้งออกจากระบบ', async () => {
    refreshResult = 'network';

    await expect(api.get('/trips')).rejects.toMatchObject({ status: 401 });
    expect(onExpired).not.toHaveBeenCalled();
  });
});
