import { Navigate, Outlet, useLocation } from 'react-router';

import ErrorState from '../../../components/ui/ErrorState.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { loginPathFor } from '../redirect.js';
import SessionCheck from './SessionCheck.jsx';

// ครอบ route ที่ต้อง login ถ้ายังไม่ login พาไปหน้า login พร้อมจำหน้าเดิมไว้
export default function RequireAuth() {
  const { status, error, restore } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <SessionCheck />;

  if (status === 'offline') {
    return (
      <div className="mx-auto max-w-md px-5 pt-16">
        <ErrorState message={error?.message} onRetry={restore} />
      </div>
    );
  }

  if (status === 'anonymous') return <Navigate to={loginPathFor(location)} replace />;

  return <Outlet />;
}
