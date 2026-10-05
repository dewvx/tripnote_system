import axios from 'axios';

// instance เดียวของทั้งแอป
// withCredentials จำเป็นสำหรับ refresh cookie (เริ่มใช้ใน F1.2)
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

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
);
