import { Outlet } from 'react-router';

export default function AuthLayout() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <p className="text-lg font-bold tracking-tight text-teal-deep">TripNote</p>
      <main className="mt-8 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
