import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { ListingImage } from '../../../components/listing/ListingImage';
import { buttonClass } from '../../../components/ui/buttonClass';
import { Dialog } from '../../../components/ui/Dialog';
import { LoadingBlock } from '../../../components/ui/Skeleton';
import { LoadError } from '../../../components/ui/States';
import { getListing } from '../../../lib/api/listings';
import { LISTING_STATUS_LABEL, LISTING_TYPE_LABEL } from '../../../lib/constants';
import { formatPrice } from '../../../lib/format';
import { queryKeys } from '../../../lib/queryKeys';

// Isi datang setelah dialog terbuka, jadi fokus dipindah saat tautan muncul.
const focusOnMount = (element: HTMLElement | null) => element?.focus();

/** PU-03. Dibuka lewat parameter URL `lihat`. */
export function QuickViewDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [shownId, setShownId] = useState(id);
  // ID terakhir dipertahankan supaya isi tidak kosong selama animasi keluar.
  if (id && id !== shownId) setShownId(id);

  const listing = useQuery({
    queryKey: queryKeys.listing(shownId ?? ''),
    queryFn: ({ signal }) => getListing(shownId ?? '', signal),
    enabled: shownId !== null,
  });

  return (
    <Dialog open={id !== null} onClose={onClose} title="Lihat cepat" size="wide" lightDismiss>
      {listing.isPending ? (
        <LoadingBlock label="Memuat listing" />
      ) : !listing.data ? (
        <LoadError error={listing.error} onRetry={() => void listing.refetch()} notFound="Listing tidak ditemukan" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <ListingImage
            key={listing.data._id}
            src={listing.data.images[0]}
            alt={listing.data.title}
            type={listing.data.type}
            category={listing.data.category}
          />
          <div className="grid content-start gap-2">
            <p className="text-sm text-muted">
              {LISTING_TYPE_LABEL[listing.data.type]} · {LISTING_STATUS_LABEL[listing.data.status]}
            </p>
            <h2 className="text-h3">{listing.data.title}</h2>
            <p className="text-h3 tabular-nums">{formatPrice(listing.data.price, listing.data.priceUnit)}</p>
            <p className="flex items-center gap-1 text-sm text-muted">
              <MapPin className="size-4" aria-hidden="true" />
              {listing.data.district}
            </p>
            <p className="line-clamp-5 break-words whitespace-pre-line">{listing.data.description}</p>
            <Link
              to={`/listing/${listing.data._id}`}
              className={buttonClass('primary', 'mt-2 justify-self-start')}
              data-autofocus=""
              ref={focusOnMount}
            >
              Lihat detail
            </Link>
          </div>
        </div>
      )}
    </Dialog>
  );
}
