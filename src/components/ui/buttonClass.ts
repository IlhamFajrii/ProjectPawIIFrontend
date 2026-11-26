export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger';

const BASE =
  'pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-full text-center text-base font-medium ' +
  'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent px-6 text-on-accent hover:opacity-90',
  secondary: 'border border-control bg-bg px-6 text-ink hover:bg-surface',
  text: 'px-3 text-accent hover:bg-surface',
  // Garis, bukan isian, agar tidak tertukar dengan tombol utama yang sama-sama merah.
  danger: 'border border-danger bg-bg px-6 text-danger hover:bg-surface',
};

export const buttonClass = (variant: ButtonVariant = 'primary', extra = '') =>
  `${BASE} ${VARIANTS[variant]} ${extra}`;

export const iconButtonClass =
  'pressable inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-surface ' +
  'disabled:cursor-not-allowed disabled:opacity-40';
