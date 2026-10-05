import { api, refreshSession } from '../../lib/axios.js';

// skipAuthRefresh: 401 ของ endpoint กลุ่มนี้คือคำตอบจริง (เช่นรหัสผิด) ไม่ใช่ token หมดอายุ
const noRefresh = { skipAuthRefresh: true };

// ทุกฟังก์ชันที่เริ่มเซสชันคืน { accessToken, user }
export async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials, noRefresh);
  return data.data;
}

export async function register(input) {
  const { data } = await api.post('/auth/register', input, noRefresh);
  return data.data;
}

export function refresh() {
  return refreshSession();
}

export async function logout() {
  await api.post('/auth/logout', null, noRefresh);
}
