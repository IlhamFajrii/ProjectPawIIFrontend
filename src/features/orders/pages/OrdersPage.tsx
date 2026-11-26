import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { OrderSummaryCard } from '../../../components/order/OrderSummaryCard';
import { Button } from '../../../components/ui/Button';
import { buttonClass } from '../../../components/ui/buttonClass';
import { SelectField } from '../../../components/ui/Field';
import { Page } from '../../../components/ui/Page';
import { Pagination } from '../../../components/ui/Pagination';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { LoadingBlock } from '../../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../../components/ui/States';
import { getOrders, type OrderRole } from '../../../lib/api/orders';
import type { UserSummary } from '../../../lib/api/types';
import { ORDER_STATUS_LABEL, ORDER_STATUSES, oneOf } from '../../../lib/constants';
import { formatDateTime } from '../../../lib/format';
import { queryKeys } from '../../../lib/queryKeys';
import { objectOf } from '../../../lib/url';

const TABS = [
  { value: 'beli', label: 'Beli' },
  { value: 'jual', label: 'Jual' },
] as const;

export default function OrdersPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('peran') === 'jual' ? 'jual' : 'beli';
  const role: OrderRole = tab === 'jual' ? 'seller' : 'buyer';
  const status = oneOf(ORDER_STATUSES, params.get('status'));
  const page = Math.max(Number.parseInt(params.get('page') ?? '1', 10) || 1, 1);
  const filters = { role, status, page };

  const orders = useQuery({
    queryKey: queryKeys.orders(filters),
    queryFn: ({ signal }) => getOrders(filters, signal),
    placeholderData: keepPreviousData,
  });

  const go = (next: { tab?: string; status?: string; page?: number }) => {
    const query = new URLSearchParams();
    const nextTab = next.tab ?? tab;
    const nextStatus = next.status ?? status ?? '';
    if (nextTab === 'jual') query.set('peran', 'jual');
    if (nextStatus) query.set('status', nextStatus);
    if (next.page && next.page > 1) query.set('page', String(next.page));
    setParams(query, { preventScrollReset: true });
  };

  return (
    <Page title="Pesanan" width="narrow">
      <div className="grid gap-4">
        <SegmentedControl legend="Peran" value={tab} options={TABS} onChange={(value) => go({ tab: value })} />
        <SelectField
          label="Status"
          placeholder="Semua status"
          value={status ?? ''}
          onChange={(event) => go({ status: event.target.value })}
          options={ORDER_STATUSES.map((value) => ({ value, label: ORDER_STATUS_LABEL[value] }))}
        />
      </div>

      {orders.isPending ? (
        <LoadingBlock label="Memuat pesanan" />
      ) : !orders.data ? (
        <ErrorState error={orders.error} onRetry={() => void orders.refetch()} />
      ) : orders.data.items.length === 0 ? (
        orders.data.total > 0 ? (
          <EmptyState title="Halaman ini kosong" action={<Button onClick={() => go({ page: 1 })}>Ke halaman 1</Button>} />
        ) : status ? (
          <EmptyState
            title="Tidak ada pesanan dengan status ini"
            action={<Button onClick={() => go({ status: '' })}>Tampilkan semua</Button>}
          />
        ) : (
          <EmptyState
            title={role === 'buyer' ? 'Kamu belum memesan apa pun' : 'Belum ada pesanan masuk'}
            action={
              <Link to={role === 'buyer' ? '/jelajah' : '/jual'} className={buttonClass()}>
                {role === 'buyer' ? 'Jelajahi listing' : 'Pasang listing'}
              </Link>
            }
          />
        )
      ) : (
        <div aria-busy={orders.isFetching}>
          <ul className={`stagger grid gap-3 ${orders.isPlaceholderData ? 'opacity-60' : ''}`}>
            {orders.data.items.map((order) => {
              const other = objectOf<UserSummary>(role === 'buyer' ? order.seller : order.buyer);
              return (
                <li key={order._id}>
                  <OrderSummaryCard
                    order={order}
                    className="relative has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent"
                    title={
                      <Link to={`/pesanan/${order._id}`} className="outline-none after:absolute after:inset-0">
                        {order.listingSnapshot.title}
                      </Link>
                    }
                  >
                    <p className="text-sm text-muted">
                      {role === 'buyer' ? 'Penjual' : 'Pembeli'}: {other?.name ?? '–'} · {formatDateTime(order.createdAt)}
                    </p>
                  </OrderSummaryCard>
                </li>
              );
            })}
          </ul>
          <Pagination
            page={orders.data.page}
            limit={orders.data.limit}
            total={orders.data.total}
            onChange={(next) => go({ page: next })}
          />
        </div>
      )}
    </Page>
  );
}
