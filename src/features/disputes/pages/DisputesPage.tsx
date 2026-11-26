import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CircleCheck, Clock } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { Button } from '../../../components/ui/Button';
import { Page } from '../../../components/ui/Page';
import { Pagination } from '../../../components/ui/Pagination';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { LoadingBlock } from '../../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../../components/ui/States';
import { getDisputes } from '../../../lib/api/disputes';
import type { Dispute, Order } from '../../../lib/api/types';
import { DISPUTE_REASON_LABEL, DISPUTE_STATUS_LABEL, oneOf } from '../../../lib/constants';
import { formatDateTime, formatRupiah } from '../../../lib/format';
import { queryKeys } from '../../../lib/queryKeys';
import { useCurrentUser } from '../../../lib/session';
import { objectOf } from '../../../lib/url';

const FILTERS = [
  { value: 'ALL', label: 'Semua' },
  { value: 'OPEN', label: 'Menunggu' },
  { value: 'RESOLVED', label: 'Diputus' },
] as const;

function Row({ dispute }: { dispute: Dispute }) {
  const order = objectOf<Order>(dispute.order);
  const Icon = dispute.status === 'OPEN' ? Clock : CircleCheck;
  return (
    <li className="relative grid gap-1 rounded-card bg-surface p-5 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-accent">
      <p className={`flex items-center gap-1.5 text-sm font-medium ${dispute.status === 'OPEN' ? 'text-warning' : 'text-success'}`}>
        <Icon className="size-4" aria-hidden="true" />
        {DISPUTE_STATUS_LABEL[dispute.status]}
      </p>
      <h2 className="text-h3">
        <Link to={`/sengketa/${dispute._id}`} className="outline-none after:absolute after:inset-0">
          {order?.listingSnapshot.title ?? 'Sengketa pesanan'}
        </Link>
      </h2>
      <p>{DISPUTE_REASON_LABEL[dispute.reason]}</p>
      <p className="text-sm break-words text-muted">
        {order && `${order.orderCode} · ${formatRupiah(order.amount)} · `}
        {formatDateTime(dispute.createdAt)}
      </p>
    </li>
  );
}

export default function DisputesPage() {
  const user = useCurrentUser();
  const [params, setParams] = useSearchParams();
  const status = oneOf(['OPEN', 'RESOLVED'] as const, params.get('status'));
  const page = Math.max(Number.parseInt(params.get('page') ?? '1', 10) || 1, 1);

  const disputes = useQuery({
    queryKey: queryKeys.disputes({ status, page }),
    queryFn: ({ signal }) => getDisputes({ status, page }, signal),
    placeholderData: keepPreviousData,
  });

  const go = (nextStatus: string | undefined, nextPage = 1) => {
    const query: Record<string, string> = {};
    if (nextStatus && nextStatus !== 'ALL') query.status = nextStatus;
    if (nextPage > 1) query.page = String(nextPage);
    setParams(query, { preventScrollReset: true });
  };

  const admin = user.role === 'admin';

  return (
    <Page
      title={admin ? 'Panel sengketa' : 'Sengketa'}
      intro={admin ? 'Semua sengketa dari seluruh pengguna.' : 'Sengketa pada pesanan yang kamu beli atau jual.'}
      width="narrow"
    >
      <SegmentedControl legend="Status sengketa" value={status ?? 'ALL'} options={FILTERS} onChange={(value) => go(value)} />
      {disputes.isPending ? (
        <LoadingBlock label="Memuat sengketa" />
      ) : !disputes.data ? (
        <ErrorState error={disputes.error} onRetry={() => void disputes.refetch()} />
      ) : disputes.data.items.length === 0 ? (
        disputes.data.total > 0 ? (
          <EmptyState title="Halaman ini kosong" action={<Button onClick={() => go(status)}>Ke halaman 1</Button>} />
        ) : (
          <EmptyState
            title="Tidak ada sengketa"
            action={status ? <Button onClick={() => go(undefined)}>Tampilkan semua</Button> : undefined}
          >
            {admin ? 'Belum ada yang perlu diputuskan.' : 'Sengketa diajukan dari halaman detail pesanan.'}
          </EmptyState>
        )
      ) : (
        <div aria-busy={disputes.isFetching}>
          <ul className="stagger grid gap-3">
            {disputes.data.items.map((dispute) => (
              <Row key={dispute._id} dispute={dispute} />
            ))}
          </ul>
          <Pagination
            page={disputes.data.page}
            limit={disputes.data.limit}
            total={disputes.data.total}
            onChange={(next) => go(status, next)}
          />
        </div>
      )}
    </Page>
  );
}
