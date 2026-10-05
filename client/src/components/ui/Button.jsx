const variants = {
  primary: 'bg-teal text-paper active:bg-teal-deep',
  ghost: 'text-teal active:bg-teal/10',
  danger: 'bg-danger text-paper active:opacity-80',
  'danger-ghost': 'text-danger active:bg-danger/10',
};

export default function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 font-medium disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
