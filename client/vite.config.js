import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// ตอน dev ให้ Vite ส่งต่อ /api ไปที่ Express
// เบราว์เซอร์จึงเห็น client กับ API เป็น origin เดียวกัน เหมือนตอน production
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.DEV_API_TARGET || 'http://localhost:3000';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
      },
    },
  };
});
