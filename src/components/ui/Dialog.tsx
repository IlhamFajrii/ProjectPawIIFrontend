import { X } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { trackModal } from '../../lib/dialogStack';
import { Button } from './Button';
import { iconButtonClass } from './buttonClass';
import { closeDialog } from './closeTopLayer';
import { DialogContext } from './dialogContext';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'default' | 'wide' | 'full';
  /** Boleh ditutup dengan klik di luar (PRD bagian 6). */
  lightDismiss?: boolean;
  /** Ada isian yang akan hilang: minta konfirmasi dulu. */
  dirty?: boolean;
  /** Request sedang berjalan dan tidak boleh dibatalkan. */
  busy?: boolean;
}

const isOutside = (event: PointerEvent<HTMLDialogElement>) => {
  const box = event.currentTarget.getBoundingClientRect();
  const { clientX: x, clientY: y } = event;
  return x < box.left || x > box.right || y < box.top || y > box.bottom;
};

export function Dialog({
  open,
  onClose,
  title,
  children,
  size = 'default',
  lightDismiss = false,
  dirty = false,
  busy = false,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const pressedOutside = useRef(false);
  const titleId = useId();
  const discardId = useId();
  const [rendered, setRendered] = useState(open);
  const [confirming, setConfirming] = useState(false);

  if (open && !rendered) setRendered(true);
  if (!open && confirming) setConfirming(false);
  const canLightDismiss = lightDismiss && !dirty && !busy;

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!open) {
      if (dialog.open) void closeDialog(dialog).then((closed) => closed && setRendered(false));
      return;
    }
    dialog.removeAttribute('data-closing');
    if (!dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    }
  }, [open, rendered]);

  useEffect(() => (open ? trackModal() : undefined), [open]);

  useEffect(() => {
    if (confirming) keepRef.current?.focus();
  }, [confirming]);

  const requestClose = () => {
    if (busy) return;
    if (dirty) setConfirming(true);
    else onClose();
  };

  if (!rendered) return null;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      data-size={size}
      className="dialog"
      {...({ closedby: canLightDismiss ? 'any' : 'closerequest' } as object)}
      onCancel={(event) => {
        // Input file juga memancarkan `cancel` yang menggelembung ke sini.
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        requestClose();
      }}
      onClose={(event) => {
        if (event.target !== event.currentTarget || !open || event.currentTarget.open) return;
        // Browser menutup paksa (Esc kedua tanpa interaksi): buka lagi bila isian harus dijaga.
        if (busy || dirty) {
          event.currentTarget.showModal();
          if (!busy) setConfirming(true);
        } else onClose();
      }}
      onPointerDown={(event) => {
        pressedOutside.current = event.target === event.currentTarget && isOutside(event);
      }}
      onPointerUp={(event) => {
        // Cadangan untuk browser tanpa `closedby`, misalnya Safari.
        if ('closedBy' in HTMLDialogElement.prototype) return;
        if (canLightDismiss && pressedOutside.current && isOutside(event)) onClose();
      }}
    >
      <DialogContext value={requestClose}>
        <div className="flex max-h-[inherit] min-h-full flex-col">
          <header className="flex items-center justify-between gap-3 py-3 pr-3 pl-5">
            <h1 id={titleId} className="text-h3">
              {title}
            </h1>
            <button type="button" className={iconButtonClass} onClick={requestClose} disabled={busy} aria-label="Tutup">
              <X className="size-6" aria-hidden="true" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
            {children}
          </div>
          {confirming && (
            <div className="border-t border-line bg-surface px-5 py-4">
              <p id={discardId} className="font-medium">
                Isian belum dikirim. Buang isian ini?
              </p>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    setConfirming(false);
                    onClose();
                  }}
                >
                  Buang isian
                </Button>
                <button
                  ref={keepRef}
                  type="button"
                  aria-describedby={discardId}
                  className="pressable min-h-11 rounded-full border border-control bg-bg px-6 font-medium"
                  onClick={() => setConfirming(false)}
                >
                  Lanjutkan mengisi
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContext>
    </dialog>
  );
}
