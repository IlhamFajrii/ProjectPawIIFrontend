import type { OrderStatus } from '../../lib/api/types';
import { ORDER_STATUS_LABEL } from '../../lib/constants';
import { STATUS_STYLE } from './statusStyle';

/** Status selalu ikon dan teks, tidak hanya warna. */
export function StatusBadge({ status }: { status: OrderStatus }) {
  const { icon: Icon, tone } = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-3 py-1 text-sm font-medium ${tone}`}>
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
