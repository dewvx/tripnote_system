import { Link } from 'react-router';

export default function BackLink({ to, children }) {
  return (
    <Link
      to={to}
      className="-ml-1 inline-flex min-h-11 max-w-full items-center gap-1 px-1 text-teal active:opacity-70"
    >
      <span aria-hidden="true">‹</span>
      <span className="truncate">{children}</span>
    </Link>
  );
}
