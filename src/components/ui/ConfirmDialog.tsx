import type { ReactNode } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';

interface Props {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
}

/** Konfirmasi aksi. Fokus awal selalu di tombol aman. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Batal',
  destructive,
  busy,
  error,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose} title={title} lightDismiss busy={busy}>
      <div className="grid gap-4">
        <div className="grid gap-2 text-muted">{children}</div>
        {error && (
          <p role="alert" className="font-medium text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" data-autofocus="" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} loading={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
