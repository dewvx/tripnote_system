import { Link, Outlet } from 'react-router';

import Button from '../components/ui/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLogout } from '../features/auth/hooks.js';

export default function AppLayout() {
  const { user } = useAuth();
  const logout = useLogout();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="flex items-center justify-between gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
        <Link to="/" className="text-lg font-bold tracking-tight text-teal-deep">
          TripNote
        </Link>
        <div className="flex min-w-0 items-center gap-1">
          <span className="truncate text-sm text-slate">{user?.displayName}</span>
          <Button variant="ghost" loading={logout.isPending} onClick={() => logout.mutate()}>
            ออกจากระบบ
          </Button>
        </div>
      </header>
      <main className="flex-1 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
    </div>
  );
}
