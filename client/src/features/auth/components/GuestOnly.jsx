import { Navigate, Outlet, useSearchParams } from 'react-router';

import { useAuth } from '../../../context/AuthContext.jsx';
import { safeNextPath } from '../redirect.js';
import SessionCheck from './SessionCheck.jsx';

// หน้า login / register: ถ้า login อยู่แล้ว (หรือเพิ่ง login สำเร็จ) พาไปหน้าที่ตั้งใจจะไป
export default function GuestOnly() {
  const { status } = useAuth();
  const [searchParams] = useSearchParams();

  if (status === 'loading') return <SessionCheck />;

  if (status === 'authenticated') {
    return <Navigate to={safeNextPath(searchParams.get('next'))} replace />;
  }

  return <Outlet />;
}
