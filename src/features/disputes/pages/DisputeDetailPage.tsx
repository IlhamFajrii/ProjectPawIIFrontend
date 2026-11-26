import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Gavel } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { OrderSummaryCard } from '../../../components/order/OrderSummaryCard';
import { OrderTimeline } from '../../../components/order/OrderTimeline';
import { Button } from '../../../components/ui/Button';
import { buttonClass } from '../../../components/ui/buttonClass';
import { Card } from '../../../components/ui/Card';
import { Page } from '../../../components/ui/Page';
import { LoadingBlock } from '../../../components/ui/Skeleton';
import { ErrorState, LoadError } from '../../../components/ui/States';
import { getDispute } from '../../../lib/api/disputes';
import { getPublicProfile } from '../../../lib/api/users';
import type { Dispute, Order, User } from '../../../lib/api/types';
import { DISPUTE_REASON_LABEL, DISPUTE_RESOLUTION_LABEL, DISPUTE_STATUS_LABEL, ESCROW_NOTICE } from '../../../lib/constants';
import { formatDateTime } from '../../../lib/format';
import { queryKeys } from '../../../lib/queryKeys';
import { useCurrentUser } from '../../../lib/session';
import { idOf, objectOf, safeUrl } from '../../../lib/url';
import { ResolveDialog } from '../components/ResolveDialog';

function PartyName({ id, label, opened }: { id: string; label: string; opened: boolean }) {
  const profile = useQuery({ queryKey: queryKeys.profile(id), queryFn: ({ signal }) => getPublicProfile(id, signal) });
  return (
    <li>
      <Link to={`/pengguna/${id}`} className="inline-flex min-h-11 items-center gap-1 underline">
        {label}: {profile.data?.name ?? 'Lihat profil'}
      </Link>
      {opened && <span className="text-sm text-muted"> (mengajukan sengketa)</span>}
    </li>
  );
}

/** Dibangun dari `dispute.order`: admin yang bukan peserta ditolak GET /orders/:id (FR-D5). */
function Detail({ dispute, order, me }: { dispute: Dispute; order: Order; me: User }) {
  const [resolving, setResolving] = useState(false);
  const buyer = idOf(order.buyer);
  const seller = idOf(order.seller);
  const party = me._id === buyer || me._id === seller;
  const admin = me.role === 'admin';
  const open = dispute.status === 'OPEN';

  return (
    <>
      <OrderSummaryCard order={order}>
        {party && (
          <Link to={`/pesanan/${order._id}`} className={buttonClass('secondary', 'justify-self-start')}>
            Buka pesanan
          </Link>
        )}
      </OrderSummaryCard>

      <Card className="grid gap-3">
        <h2 className="text-h3">{DISPUTE_STATUS_LABEL[dispute.status]}</h2>
        {dispute.resolution ? (
          <>
            <p className="font-semibold">{DISPUTE_RESOLUTION_LABEL[dispute.resolution]}</p>
            {dispute.adminNote && <p className="break-words whitespace-pre-line">{dispute.adminNote}</p>}
            <p className="text-sm text-muted">Diputus {formatDateTime(dispute.resolvedAt)}</p>
          </>
        ) : (
          <p className="text-muted">Dana ditahan sampai admin memutuskan.</p>
        )}
        {open && admin && !party && (
          <Button className="justify-self-start" onClick={() => setResolving(true)}>
            <Gavel className="size-5" aria-hidden="true" />
            Putuskan sengketa
          </Button>
        )}
        {open && admin && party && (
          <p className="font-medium text-warning">
            Kamu peserta pesanan ini, jadi sengketanya harus diputus admin lain.
          </p>
        )}
        <p className="text-sm text-muted">{ESCROW_NOTICE}</p>
      </Card>

      <section aria-labelledby="keluhan" className="grid gap-2">
        <h2 id="keluhan" className="text-h3">
          {DISPUTE_REASON_LABEL[dispute.reason]}
        </h2>
        <p className="break-words whitespace-pre-line">{dispute.description}</p>
        <p className="text-sm text-muted">Diajukan {formatDateTime(dispute.createdAt)}</p>
        {dispute.evidence.length > 0 && (
          <ul aria-label="Bukti" className="grid gap-1">
            {dispute.evidence.map((url, index) => (
              <li key={`${url}-${index}`}>
                {safeUrl(url) ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="inline-flex min-h-11 max-w-full items-center gap-2 underline"
                  >
                    <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      Bukti {index + 1}: {url}
                    </span>
                  </a>
                ) : (
                  <span className="break-all text-muted">Bukti {index + 1}: tautan tidak aman</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="pihak" className="grid gap-1">
        <h2 id="pihak" className="text-h3">
          Pihak
        </h2>
        <ul>
          <PartyName id={buyer} label="Pembeli" opened={dispute.openedBy === buyer} />
          <PartyName id={seller} label="Penjual" opened={dispute.openedBy === seller} />
        </ul>
        {order.note && <p className="break-words whitespace-pre-line text-muted">Catatan pesanan: {order.note}</p>}
      </section>

      <section aria-labelledby="riwayat" className="grid gap-3">
        <h2 id="riwayat" className="text-h3">
          Riwayat status
        </h2>
        <OrderTimeline history={order.statusHistory} buyerId={buyer} sellerId={seller} />
      </section>

      {admin && !party && (
        <ResolveDialog disputeId={dispute._id} order={order} open={resolving && open} onClose={() => setResolving(false)} />
      )}
    </>
  );
}

export default function DisputeDetailPage() {
  const { id = '' } = useParams();
  const me = useCurrentUser();
  const dispute = useQuery({
    queryKey: queryKeys.dispute(id),
    queryFn: ({ signal }) => getDispute(id, signal),
    staleTime: 0,
  });
  const order = objectOf<Order>(dispute.data?.order);

  return (
    <Page title="Detail sengketa" width="narrow">
      {dispute.isPending ? (
        <LoadingBlock label="Memuat sengketa" />
      ) : dispute.isError && !dispute.data ? (
        <LoadError error={dispute.error} onRetry={() => void dispute.refetch()} notFound="Sengketa tidak ditemukan" />
      ) : dispute.data && order ? (
        <Detail dispute={dispute.data} order={order} me={me} />
      ) : (
        <ErrorState error={dispute.error} onRetry={() => void dispute.refetch()} />
      )}
    </Page>
  );
}
