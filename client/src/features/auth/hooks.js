import { useMutation } from '@tanstack/react-query';

import { useAuth } from '../../context/AuthContext.jsx';
import * as authApi from './api.js';

export function useLogin() {
  const { startSession } = useAuth();
  return useMutation({ mutationFn: authApi.login, onSuccess: startSession });
}

export function useRegister() {
  const { startSession } = useAuth();
  return useMutation({ mutationFn: authApi.register, onSuccess: startSession });
}

export function useLogout() {
  const { endSession } = useAuth();
  return useMutation({
    mutationFn: authApi.logout,
    // ออกจากเครื่องนี้เสมอ แม้เรียก server ไม่สำเร็จ (เช่นเน็ตหลุด)
    onSettled: endSession,
  });
}
