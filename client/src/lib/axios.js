import axios from 'axios';

// instance เดียวของทั้งแอป
// withCredentials จำเป็นสำหรับ refresh cookie
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  timeout: 15_000,
});

// แปลง error ทุกแบบให้เป็นรูปเดียว: { code, message, details, status }
export function toApiError(error) {
  const payload = error?.response?.data?.error;
  if (payload) {
    return { ...payload, status: error.response.status };
  }
  if (error?.code === 'ECONNABORTED') {
    return { code: 'TIMEOUT', message: 'เซิร์ฟเวอร์ตอบช้าเกินไป ลองใหม่อีกครั้ง', status: 0 };
  }
  return {
    code: 'NETWORK_ERROR',
    message: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ เช็กสัญญาณเน็ตแล้วลองใหม่',
    status: error?.response?.status ?? 0,
  };
}

// ---------- access token ----------
// เก็บใน memory เท่านั้น ไม่ลง localStorage (ARCHITECTURE.md §2.3)
// ปิดแอปแล้ว token หายไป ตอนเปิดใหม่จะขอใหม่จาก refresh cookie

let accessToken = null;
let onSessionExpired = () => {};

export function setAccessToken(token) {
  accessToken = token;
}

// AuthContext ลงทะเบียนไว้ เพื่อพากลับหน้า login เมื่อต่ออายุไม่สำเร็จ
export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

// ใช้ร่วมกันทุกจุดที่ต้อง refresh: ถ้ามีคำขอค้างอยู่แล้วให้รอตัวเดิม ไม่ยิงซ้ำ
// สำคัญมากเพราะ refresh token ถูกหมุนทุกครั้ง ถ้ายิงสองครั้งพร้อมกันด้วย cookie เดิม
// server จะมองว่า token ถูกใช้ซ้ำและเพิกถอนทุกเซสชัน
let refreshing = null;

export function refreshSession() {
  refreshing ??= api
    .post('/auth/refresh', null, { skipAuthRefresh: true })
    .then(({ data }) => {
      setAccessToken(data.data.accessToken);
      return data.data;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    // token หมดอายุ: ต่ออายุเงียบ ๆ แล้วยิงคำขอเดิมซ้ำหนึ่งครั้ง ผู้ใช้ไม่รู้สึก
    // ข้าม /auth/* เพราะ 401 ที่นั่นหมายถึงรหัสผิดหรือ cookie ใช้ไม่ได้จริง ๆ
    if (response?.status === 401 && config && !config.skipAuthRefresh && !config._retried) {
      config._retried = true;
      try {
        await refreshSession();
      } catch (refreshError) {
        // เน็ตหลุดตอน refresh ไม่ใช่เซสชันหมด ไม่ต้องเด้งออก
        if (refreshError?.status === 401) {
          setAccessToken(null);
          onSessionExpired();
        }
        return Promise.reject(toApiError(error));
      }
      return api(config);
    }

    return Promise.reject(toApiError(error));
  },
);
