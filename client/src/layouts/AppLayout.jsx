import { Link, Outlet } from 'react-router';

export default function AppLayout() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
        <Link to="/" className="text-lg font-bold tracking-tight text-teal-deep">
          TripNote
        </Link>
      </header>
      <main className="flex-1 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
    </div>
  );
}
