import { Plus, Trash2 } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { MAX_URLS } from '../../lib/schemas';
import { Button } from './Button';
import { iconButtonClass } from './buttonClass';
import { TextField } from './Field';

interface Props {
  legend: string;
  hint: string;
  rows: { id: string }[];
  inputProps: (index: number) => ComponentProps<'input'>;
  error: (index: number) => string | undefined;
  listError?: string;
  preview?: (index: number) => ReactNode;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export function UrlListFields({ legend, hint, rows, inputProps, error, listError, preview, onAdd, onRemove }: Props) {
  return (
    <fieldset className="grid min-w-0 gap-3">
      <legend className="text-sm font-medium">{legend}</legend>
      <p className="text-sm text-muted">{hint}</p>
      {rows.map((row, index) => (
        <div key={row.id} className="grid gap-2">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <TextField
                {...inputProps(index)}
                label={`URL ${index + 1}`}
                type="url"
                inputMode="url"
                placeholder="https://"
                autoComplete="off"
                error={error(index)}
              />
            </div>
            <button
              type="button"
              className={`${iconButtonClass} mt-6`}
              onClick={() => onRemove(index)}
              aria-label={`Hapus URL ${index + 1}`}
            >
              <Trash2 className="size-5" aria-hidden="true" />
            </button>
          </div>
          {preview?.(index)}
        </div>
      ))}
      {listError && <p className="text-sm font-medium text-danger">{listError}</p>}
      <Button variant="secondary" className="justify-self-start" disabled={rows.length >= MAX_URLS} onClick={onAdd}>
        <Plus className="size-5" aria-hidden="true" />
        Tambah URL ({rows.length}/{MAX_URLS})
      </Button>
    </fieldset>
  );
}
