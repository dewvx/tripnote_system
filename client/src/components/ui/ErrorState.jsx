export default function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="rounded-xl border border-danger/30 bg-danger/5 p-4">
      <p className="font-medium text-danger">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 min-h-11 rounded-lg bg-ink px-4 font-medium text-paper active:opacity-80"
        >
          ลองใหม่
        </button>
      )}
    </div>
  );
}
