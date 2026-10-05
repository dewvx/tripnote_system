import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as authApi from '../features/auth/api.js';
import { setAccessToken, setSessionExpiredHandler } from '../lib/axios.js';

const AuthContext = createContext(null);

// status:
//   loading        กำลังเช็กว่ายังมีเซสชันเดิมอยู่ไหม (ตอนเปิดแอป)
//   authenticated  login แล้ว
//   anonymous      ยังไม่ได้ login
//   offline        เช็กไม่ได้เพราะเน็ตมีปัญหา ไม่ถือว่าหลุดจากระบบ ให้ลองใหม่ได้
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState({ status: 'loading', user: null, error: null });

  const startSession = useCallback(({ accessToken, user }) => {
    setAccessToken(accessToken);
    setState({ status: 'authenticated', user, error: null });
  }, []);

  const endSession = useCallback(() => {
    setAccessToken(null);
    setState({ status: 'anonymous', user: null, error: null });
    // ล้าง cache ของผู้ใช้คนเดิม ไม่ให้คนถัดไปที่ login บนเครื่องเดียวกันเห็น
    queryClient.clear();
  }, [queryClient]);

  const restore = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      startSession(await authApi.refresh());
    } catch (error) {
      if (error?.status === 401) {
        setState({ status: 'anonymous', user: null, error: null });
      } else {
        setState({ status: 'offline', user: null, error });
      }
    }
  }, [startSession]);

  useEffect(() => {
    setSessionExpiredHandler(endSession);
    restore();
  }, [endSession, restore]);

  const value = useMemo(
    () => ({ ...state, startSession, endSession, restore }),
    [state, startSession, endSession, restore],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth ต้องอยู่ใน <AuthProvider>');
  return context;
}
