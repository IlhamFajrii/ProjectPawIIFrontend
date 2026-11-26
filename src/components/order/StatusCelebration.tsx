import { CircleCheck, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import type { OrderStatus } from '../../lib/api/types';
import { cssVars } from '../../lib/cssVars';

const MOMENTS: Partial<Record<OrderStatus, typeof CircleCheck>> = {
  HELD_IN_ESCROW: ShieldCheck,
  COMPLETED: CircleCheck,
};

/**
 * Perayaan singkat saat dana ditahan atau pesanan selesai selagi halaman dibuka (MO-22).
 * Hanya hiasan: perubahan status sudah diumumkan oleh teks.
 */
export function StatusCelebration({ status }: { status: OrderStatus }) {
  const [previous, setPrevious] = useState(status);
  const [moment, setMoment] = useState<OrderStatus>();
  if (status !== previous) {
    setPrevious(status);
    setMoment(MOMENTS[status] ? status : undefined);
  }
  const Icon = moment ? MOMENTS[moment] : undefined;
  if (!Icon) return null;

  return (
    <div
      aria-hidden="true"
      className="celebrate"
      onAnimationEnd={(event) => event.target === event.currentTarget && setMoment(undefined)}
    >
      <span className="celebrate-ring size-20 rounded-full" />
      {Array.from({ length: 8 }, (_, index) => (
        <span key={index} className="celebrate-spark h-5 w-1 rounded-full bg-accent" style={cssVars({ '--i': index })} />
      ))}
      <span className="celebrate-badge grid size-20 place-items-center rounded-full bg-success text-bg shadow-float">
        <Icon className="size-10" />
      </span>
    </div>
  );
}
