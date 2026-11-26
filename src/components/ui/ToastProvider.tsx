import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { modalCount, subscribeModals } from '../../lib/dialogStack';
import { ToastContext } from '../../lib/toast';
import { iconButtonClass } from './buttonClass';

interface Item {
  id: number;
  kind: 'success' | 'error';
  message: string;
}

const LIFETIME = 5000;

function Toast({ item, onClose }: { item: Item; onClose: (id: number) => void }) {
  const [held, setHeld] = useState(false);
  const Icon = item.kind === 'error' ? CircleAlert : CircleCheck;

  // Sukses hilang sendiri, kecuali sedang disorot atau difokus. Error bertahan sampai ditutup.
  useEffect(() => {
    if (item.kind === 'error' || held) return;
    const timer = setTimeout(() => onClose(item.id), LIFETIME);
    return () => clearTimeout(timer);
  }, [item, held, onClose]);

  return (
    <li
      className="toast flex items-start gap-3 rounded-card border border-line bg-bg py-2 pr-2 pl-4 shadow-float"
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      <Icon
        className={`mt-2.5 size-5 shrink-0 ${item.kind === 'error' ? 'text-danger' : 'text-success'}`}
        aria-hidden="true"
      />
      <p className="min-w-0 flex-1 py-2 text-sm break-words">{item.message}</p>
      <button type="button" className={iconButtonClass} onClick={() => onClose(item.id)} aria-label="Tutup notifikasi">
        <X className="size-5" aria-hidden="true" />
      </button>
    </li>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const nextId = useRef(0);
  const region = useRef<HTMLDivElement>(null);
  const modals = useSyncExternalStore(subscribeModals, modalCount);
  const visible = modals === 0 && items.length > 0;

  const push = useCallback((kind: Item['kind'], message: string) => {
    nextId.current += 1;
    const item = { id: nextId.current, kind, message };
    setItems((list) => [...list.filter((other) => other.message !== message), item].slice(-3));
  }, []);

  const close = useCallback((id: number) => {
    const focused = region.current?.contains(document.activeElement);
    setItems((list) => list.filter((item) => item.id !== id));
    if (focused) {
      requestAnimationFrame(() => {
        (region.current?.querySelector('button') ?? document.querySelector<HTMLElement>('main'))?.focus();
      });
    }
  }, []);

  const api = useMemo(
    () => ({
      success: (message: string) => push('success', message),
      error: (message: string) => push('error', message),
    }),
    [push],
  );

  useEffect(() => {
    const element = region.current;
    if (!element?.showPopover) return;
    const shown = element.matches(':popover-open');
    if (visible && !shown) element.showPopover();
    if (!visible && shown) element.hidePopover();
  }, [visible]);

  const latest = (kind: Item['kind']) =>
    modals === 0 ? items.filter((item) => item.kind === kind).at(-1) : undefined;

  return (
    <ToastContext value={api}>
      {children}
      {/* Wilayah live yang selalu ada, agar pesan baru pasti diumumkan. */}
      <div className="sr-only" role="status">
        {latest('success')?.message}
      </div>
      <div className="sr-only" role="alert">
        {latest('error')?.message}
      </div>
      <div ref={region} popover="manual" role="region" aria-label="Notifikasi" className="toast-region">
        <ul className="grid gap-2">
          {visible && items.map((item) => <Toast key={item.id} item={item} onClose={close} />)}
        </ul>
      </div>
    </ToastContext>
  );
}
