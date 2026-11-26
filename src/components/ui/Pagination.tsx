import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface Props {
  page: number;
  limit: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, limit, total, onChange }: Props) {
  const pages = Math.max(Math.ceil(total / limit), 1);
  if (pages <= 1) return null;

  return (
    <nav aria-label="Halaman" className="flex flex-wrap items-center justify-center gap-3 pt-6">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="size-5" aria-hidden="true" />
        Sebelumnya
      </Button>
      <p className="text-sm text-muted tabular-nums" aria-live="polite">
        Halaman {page} dari {pages}
      </p>
      <Button variant="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Berikutnya
        <ChevronRight className="size-5" aria-hidden="true" />
      </Button>
    </nav>
  );
}
