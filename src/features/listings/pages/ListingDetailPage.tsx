import { useMutation, useQuery } from '@tanstack/react-query';
import { MapPin, MessageCircle, Pencil, ShoppingBag } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { buttonClass } from '../../../components/ui/buttonClass';
import { LoadingBlock, Skeleton } from '../../../components/ui/Skeleton';
import { LoadError } from '../../../components/ui/States';
import { startConversation } from '../../../lib/api/conversations';
import { getListing } from '../../../lib/api/listings';
import type { Listing, UserSummary } from '../../../lib/api/types';
import { LISTING_STATUS_LABEL, LISTING_TYPE_LABEL } from '../../../lib/constants';
import { formatDate, formatPrice } from '../../../lib/format';
import { errorMessage } from '../../../lib/formErrors';
import { useTitle } from '../../../lib/hooks';
import { queryKeys } from '../../../lib/queryKeys';
import { useSession } from '../../../lib/session';
import { useToast } from '../../../lib/toast';
import { objectOf } from '../../../lib/url';
import { listingAccess } from '../access';
import { Gallery } from '../components/Gallery';

// Form pesanan (dan pustaka validasinya) baru diunduh saat tombol Pesan ditekan.
const CreateOrderDialog = lazy(() =>
  import('../components/CreateOrderDialog').then((module) => ({ default: module.CreateOrderDialog })),
);

function Owner({ owner }: { owner: UserSummary }) {
  return (
    <Link to={`/pengguna/${owner._id}`} className="pressable flex min-h-14 items-center gap-3 rounded-card bg-surface p-3">
      <Avatar name={owner.name} src={owner.avatarUrl} />
      <span className="min-w-0">
        <span className="block truncate font-semibold">{owner.name}</span>
        <span className="block text-sm text-muted">
          {[owner.district, owner.createdAt && `bergabung ${formatDate(owner.createdAt)}`].filter(Boolean).join(' · ')}
        </span>
      </span>
    </Link>
  );
}

function Actions({ listing }: { listing: Listing }) {
  const { status, user, openAuth } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const [ordering, setOrdering] = useState(false);
  // Tetap terpasang setelah dibuka sekali, agar animasi keluar berjalan.
  const [orderUsed, setOrderUsed] = useState(false);
  const { isOwner, orderBlock } = listingAccess(listing, user?._id);

  const chat = useMutation({
    mutationFn: () => startConversation(listing._id),
    onSuccess: (conversation) => void navigate(`/pesan/${conversation._id}`),
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (isOwner) {
    return (
      <div className="grid gap-2">
        <p className="text-sm text-muted">Ini listing milikmu.</p>
        <Link to={`/listing/${listing._id}/ubah`} className={buttonClass()}>
          <Pencil className="size-5" aria-hidden="true" />
          Ubah
        </Link>
      </div>
    );
  }

  // Selagi sesi dipulihkan, pemilik belum bisa dikenali.
  if (status === 'loading') return <Skeleton className="h-11 rounded-full" />;

  const guest = status === 'guest';

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-3">
        <Button
          disabled={orderBlock !== null}
          aria-describedby={orderBlock ? 'alasan-pesan' : undefined}
          onClick={() => {
            if (guest) return openAuth();
            setOrderUsed(true);
            setOrdering(true);
          }}
        >
          <ShoppingBag className="size-5" aria-hidden="true" />
          Pesan
        </Button>
        <Button variant="secondary" loading={chat.isPending} onClick={() => (guest ? openAuth() : chat.mutate())}>
          <MessageCircle className="size-5" aria-hidden="true" />
          Chat
        </Button>
      </div>
      {orderBlock && (
        <p id="alasan-pesan" className="text-sm font-medium text-warning">
          {orderBlock}
        </p>
      )}
      {!guest && orderUsed && (
        <Suspense fallback={null}>
          <CreateOrderDialog listing={listing} open={ordering} onClose={() => setOrdering(false)} />
        </Suspense>
      )}
    </div>
  );
}

export default function ListingDetailPage() {
  const { id = '' } = useParams();
  const listing = useQuery({ queryKey: queryKeys.listing(id), queryFn: ({ signal }) => getListing(id, signal) });
  useTitle(listing.data?.title ?? 'Detail listing');

  const owner = objectOf<UserSummary>(listing.data?.owner);

  return (
    <div className="mx-auto w-full max-w-page px-4 py-6 md:px-6 lg:px-8 lg:py-10">
      {listing.isPending ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Skeleton className="aspect-4/3 rounded-card" />
          <LoadingBlock label="Memuat listing" />
        </div>
      ) : !listing.data ? (
        <LoadError error={listing.error} onRetry={() => void listing.refetch()} notFound="Listing tidak ditemukan" />
      ) : (
        <article className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Gallery key={listing.data._id} listing={listing.data} />
          <div className="grid min-w-0 content-start gap-5">
            <header className="grid gap-2">
              <p className="text-sm text-muted">
                {LISTING_TYPE_LABEL[listing.data.type]} · <span className="capitalize">{listing.data.category}</span> ·{' '}
                {LISTING_STATUS_LABEL[listing.data.status]}
              </p>
              <h1 className="w-fit max-w-full text-h1" style={{ viewTransitionName: 'listing-title' }}>
                {listing.data.title}
              </h1>
              <p className="text-h2 break-words tabular-nums">{formatPrice(listing.data.price, listing.data.priceUnit)}</p>
              <p className="flex items-center gap-1.5 text-muted">
                <MapPin className="size-5" aria-hidden="true" />
                {listing.data.district}
              </p>
            </header>
            <Actions listing={listing.data} />
            {owner && <Owner owner={owner} />}
            <section aria-labelledby="deskripsi" className="grid gap-2">
              <h2 id="deskripsi" className="text-h3">
                Deskripsi
              </h2>
              <p className="max-w-prose break-words whitespace-pre-line">{listing.data.description}</p>
            </section>
          </div>
        </article>
      )}
    </div>
  );
}
