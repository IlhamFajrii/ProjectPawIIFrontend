import { useEffect, useRef } from 'react';
import type { FlatError } from '../../lib/formErrors';

interface Props {
  /** Pesan dari server. Diberi fokus saat muncul. */
  message?: string;
  errors?: FlatError[];
  labels?: Record<string, string>;
  onSelect?: (name: string) => void;
}

const labelFor = (name: string, labels: Record<string, string>) => {
  const [root = name, index] = name.split('.');
  const label = labels[root] ?? root;
  return index === undefined ? label : `${label} ${Number(index) + 1}`;
};

export function FormSummary({ message, errors = [], labels = {}, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (message) ref.current?.focus();
  }, [message]);

  if (!message && errors.length === 0) return null;

  return (
    <div ref={ref} tabIndex={-1} role="alert" className="rounded-input border-2 border-danger p-3 text-sm">
      <p className="font-semibold text-danger">{message ?? 'Periksa lagi isian berikut.'}</p>
      {errors.length > 0 && (
        <ul className="mt-1 grid gap-0.5">
          {errors.map((error) => (
            <li key={error.name}>
              <button type="button" className="min-h-11 text-left underline" onClick={() => onSelect?.(error.name)}>
                {labelFor(error.name, labels)}: {error.message}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
