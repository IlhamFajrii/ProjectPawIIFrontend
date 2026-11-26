import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { OrderSummaryCard } from '../../../components/order/OrderSummaryCard';
import { StatusCelebration } from '../../../components/order/StatusCelebration';
import { OrderTimeline } from '../../../components/order/OrderTimeline';
import { Avatar } from '../../../components/ui/Avatar';
import { buttonClass } from '../../../components/ui/buttonClass';
import { Page } from '../../../components/ui/Page';
import { LoadingBlock } from '../../../components/ui/Skeleton';
import { LoadError } from '../../../components/ui/States';
import { getOrder } from '../../../lib/api/orders';
import type { UserSummary } from '../../../lib/api/types';
import { ESCROW_NOTICE, ORDER_STATUS_LABEL } from '../../../lib/constants';
import { formatDateTime } from '../../../lib/format';
import { queryKeys } from '../../../lib/queryKeys';
import { useCurrentUser } from '../../../lib/session';
import { idOf, objectOf } from '../../../lib/url';
import { OrderActions } from '../components/OrderActions';

function Party({ label, party, self }: { label: string; party: UserSummary | string; self: boolean }) {
  const user = objectOf<UserSummary>(party);
  return (
    <li>
      <Link to={`/pengguna/${idOf(party)}`} className="pressable flex min-h-14 items-center gap-3 rounded-card bg-surface p-3">
        <Avatar name={user?.name ?? label} src={user?.avatarUrl} />
        <span className="min-w-0">
          <span className="block text-sm text-muted">
            {label}
            {self && ' (kamu)'}
          </span>
          <span className="block truncate font-semibold">{user?.name ?? 'Lihat profil'}</span>
        </span>
      </Link>
    </li>
  );
}

export default function OrderDetailPage() {
  const { id = '' } = useParams();
  const me = useCurrentUser();
  const order = useQuery({
    queryKey: queryKeys.order(id),
    queryFn: ({ signal }) => getOrder(id, signal),
    // Pihak lain bisa mengubah status kapan saja.
    staleTime: 0,
  });

  const data = order.data;
  const role = data && idOf(data.buyer) === me._id ? 'buyer' : 'seller';

  return (
    <Page title="Detail pesanan" documentTitle={data ? `Pesanan ${data.orderCode}` : 'Detail pesanan'} width="narrow">
      {order.isPending ? (
        <LoadingBlock label="Memuat pesanan" />
      ) : order.isError && !data ? (
        <LoadError error={order.error} onRetry={() => void order.refetch()} notFound="Pesanan tidak ditemukan" />
      ) : data ? (
        <>
          <div className="relative">
            <OrderSummaryCard order={data}>
              <p className="text-sm text-muted">Dibuat {formatDateTime(data.createdAt)}</p>
            </OrderSummaryCard>
            <StatusCelebration key={data._id} status={data.status} />
          </div>

          <div className="grid gap-3">
            <p className="sr-only" aria-live="polite">
              Status pesanan: {ORDER_STATUS_LABEL[data.status]}
            </p>
            <OrderActions order={data} role={role} />
            <p className="text-sm text-muted">{ESCROW_NOTICE}</p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            <Party label="Pembeli" party={data.buyer} self={role === 'buyer'} />
            <Party label="Penjual" party={data.seller} self={role === 'seller'} />
          </ul>

          {data.note && (
            <section aria-labelledby="catatan" className="grid gap-2">
              <h2 id="catatan" className="text-h3">
                Catatan pembeli
              </h2>
              <p className="break-words whitespace-pre-line">{data.note}</p>
            </section>
          )}

          <section aria-labelledby="riwayat" className="grid gap-3">
            <h2 id="riwayat" className="text-h3">
              Riwayat status
            </h2>
            <OrderTimeline history={data.statusHistory} buyerId={idOf(data.buyer)} sellerId={idOf(data.seller)} />
          </section>

          <Link to={`/listing/${data.listing}`} className={buttonClass('text', 'justify-self-start')}>
            Buka listing
          </Link>
        </>
      ) : null}
    </Page>
  );
}
