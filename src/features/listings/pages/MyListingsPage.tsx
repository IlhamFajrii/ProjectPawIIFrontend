import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ListingImage } from '../../../components/listing/ListingImage';
import { Button } from '../../../components/ui/Button';
import { buttonClass } from '../../../components/ui/buttonClass';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Page } from '../../../components/ui/Page';
import { Pagination } from '../../../components/ui/Pagination';
import { LoadingBlock } from '../../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../../components/ui/States';
import { deactivateListing, getMyListings } from '../../../lib/api/listings';
import type { Listing } from '../../../lib/api/types';
import { LISTING_STATUS_LABEL, LISTING_TYPE_LABEL } from '../../../lib/constants';
import { formatPrice } from '../../../lib/format';
import { errorMessage } from '../../../lib/formErrors';
import { queryKeys } from '../../../lib/queryKeys';
import { useToast } from '../../../lib/toast';

const createLink = (
  <Link to="/jual" className={buttonClass()}>
    <Plus className="size-5" aria-hidden="true" />
    Pasang listing
  </Link>
);

function Row({ listing, onDeactivate }: { listing: Listing; onDeactivate: () => void }) {
  const inactive = listing.status === 'INACTIVE';
  return (
    <li className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 rounded-card bg-surface p-4 sm:grid-cols-[7rem_minmax(0,1fr)_auto]">
      <ListingImage src={listing.images[0]} alt="" type={listing.type} compact className="self-start bg-bg" />
      <div className="grid content-start gap-1">
        <p className="text-sm text-muted">
          {LISTING_TYPE_LABEL[listing.type]} · <strong className="text-ink">{LISTING_STATUS_LABEL[listing.status]}</strong>
        </p>
        <h2 className="text-base font-semibold">
          {inactive ? (
            // Detail listing nonaktif menjawab 404, jadi tanpa tautan (FR-L8).
            listing.title
          ) : (
            <Link to={`/listing/${listing._id}`} className="inline-flex min-h-11 items-center underline">
              {listing.title}
            </Link>
          )}
        </h2>
        <p className="tabular-nums">{formatPrice(listing.price, listing.priceUnit)}</p>
      </div>
      {!inactive && (
        <div className="col-span-2 flex flex-wrap gap-2 sm:col-span-1 sm:flex-col sm:justify-center">
          <Link to={`/listing/${listing._id}/ubah`} className={buttonClass('secondary')} aria-label={`Ubah ${listing.title}`}>
            <Pencil className="size-5" aria-hidden="true" />
            Ubah
          </Link>
          <Button variant="text" onClick={onDeactivate} aria-label={`Nonaktifkan ${listing.title}`}>
            <Ban className="size-5" aria-hidden="true" />
            Nonaktifkan
          </Button>
        </div>
      )}
    </li>
  );
}

export default function MyListingsPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(Number.parseInt(params.get('page') ?? '1', 10) || 1, 1);
  const toast = useToast();
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<Listing | null>(null);
  const [open, setOpen] = useState(false);

  const listings = useQuery({
    queryKey: queryKeys.myListings(page),
    queryFn: ({ signal }) => getMyListings(page, 12, signal),
    placeholderData: keepPreviousData,
  });

  const deactivate = useMutation({
    mutationFn: deactivateListing,
    onSuccess: () => {
      setOpen(false);
      toast.success('Listing dinonaktifkan.');
    },
    // 409 saat sedang dipesan tampil di dalam dialog, lalu daftar dimuat ulang.
    onSettled: () => {
      for (const queryKey of [['my-listings'], ['listing'], queryKeys.listings()]) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  return (
    <Page title="Listing saya" actions={createLink}>
      {listings.isPending ? (
        <LoadingBlock label="Memuat listing" />
      ) : !listings.data ? (
        <ErrorState error={listings.error} onRetry={() => void listings.refetch()} />
      ) : listings.data.items.length === 0 ? (
        listings.data.total > 0 ? (
          <EmptyState title="Halaman ini kosong" action={<Button onClick={() => setParams({})}>Ke halaman 1</Button>} />
        ) : (
          <EmptyState title="Kamu belum punya listing" action={createLink}>
            Tawarkan barang, sewa, jasa, atau tugas ke orang di sekitarmu.
          </EmptyState>
        )
      ) : (
        <>
          <ul className="stagger grid gap-3">
            {listings.data.items.map((listing) => (
              <Row
                key={listing._id}
                listing={listing}
                onDeactivate={() => {
                  deactivate.reset();
                  setTarget(listing);
                  setOpen(true);
                }}
              />
            ))}
          </ul>
          <Pagination
            page={listings.data.page}
            limit={listings.data.limit}
            total={listings.data.total}
            onChange={(next) => setParams(next > 1 ? { page: String(next) } : {})}
          />
        </>
      )}

      {/* PU-10 */}
      <ConfirmDialog
        open={open}
        title="Nonaktifkan listing?"
        confirmLabel="Nonaktifkan"
        destructive
        busy={deactivate.isPending}
        error={deactivate.error ? errorMessage(deactivate.error) : undefined}
        onConfirm={() => target && deactivate.mutate(target._id)}
        onClose={() => setOpen(false)}
      >
        <p>
          <strong className="text-ink">{target?.title}</strong> tidak akan tampil lagi di pencarian.
        </p>
        <p>Tindakan ini tidak bisa dibatalkan: listing nonaktif tidak bisa diaktifkan lagi.</p>
      </ConfirmDialog>
    </Page>
  );
}
