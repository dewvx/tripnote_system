export default function Spinner({ label = 'กำลังโหลด' }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-slate">
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-line border-t-teal"
      />
      <span>{label}</span>
    </span>
  );
}
