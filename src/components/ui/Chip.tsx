import { X } from 'lucide-react';

/** Filter yang sedang aktif; menekannya menghapus filter itu. */
export function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Hapus filter ${label}`}
      className="pressable inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-control bg-bg px-4 text-sm font-medium hover:bg-surface"
    >
      <span className="truncate">{label}</span>
      <X className="size-4 shrink-0" aria-hidden="true" />
    </button>
  );
}
