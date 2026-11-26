import type { ReactNode } from 'react';
import type { Order } from '../../lib/api/types';
import { LISTING_TYPE_LABEL, PRICE_UNIT_LABEL } from '../../lib/constants';
import { formatRupiah } from '../../lib/format';
import { TYPE_ICON } from '../listing/typeIcon';
import { StatusBadge } from './StatusBadge';

type CardOrder = Pick<Order, 'orderCode' | 'listingSnapshot' | 'quantity' | 'amount' | 'status'>;

interface Props {
  order: CardOrder;
  /** Judul bisa berupa tautan di daftar pesanan. */
  title?: ReactNode;
  heading?: 'h2' | 'h3';
  children?: ReactNode;
  className?: string;
}

/** Pesanan tidak menyimpan foto (G-06), jadi dipakai ikon tipe. */
export function OrderSummaryCard({ order, title, heading: Heading = 'h2', children, className = '' }: Props) {
  const { listingSnapshot: snapshot } = order;
  const Icon = TYPE_ICON[snapshot.type];

  return (
    <article className={`grid gap-4 rounded-card bg-surface p-5 ${className}`}>
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-input bg-bg text-muted">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm break-words text-muted">
            {LISTING_TYPE_LABEL[snapshot.type]} · {order.orderCode}
          </p>
          <Heading className="text-h3">{title ?? snapshot.title}</Heading>
          <p className="text-sm text-muted tabular-nums">
            {order.quantity} {PRICE_UNIT_LABEL[snapshot.priceUnit]} × {formatRupiah(snapshot.price)}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusBadge status={order.status} />
        <p className="text-h3 tabular-nums">
          <span className="sr-only">Total </span>
          {formatRupiah(order.amount)}
        </p>
      </div>
      {children}
    </article>
  );
}
