export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton rounded-input bg-surface ${className}`} />;
}

/** Kerangka memuat untuk layar berisi daftar atau detail. */
export function LoadingBlock({ label = 'Memuat data', rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div role="status" className="grid gap-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-24" />
      ))}
    </div>
  );
}
