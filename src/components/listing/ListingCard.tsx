import { MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useViewTransitionState } from 'react-router';
import type { Listing } from '../../lib/api/types';
import { LISTING_TYPE_LABEL } from '../../lib/constants';
import { formatPrice } from '../../lib/format';
import { supportsViewTransition } from '../../lib/viewTransition';
import { ListingImage } from './ListingImage';

export function ListingCard({ listing, action }: { listing: Listing; action?: ReactNode }) {
  const to = `/listing/${listing._id}`;
  // Nama view transition hanya dipasang pada kartu yang sedang dituju, karena harus unik (MO-07).
  const moving = useViewTransitionState(to);

  return (
    <article className="zoom-host relative grid h-full grid-rows-[auto_1fr] gap-3 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-accent rounded-card">
      <ListingImage
        src={listing.images[0]}
        alt={listing.title}
        type={listing.type}
        category={listing.category}
        style={moving ? { viewTransitionName: 'listing-photo' } : undefined}
      />
      <div className="grid content-start gap-1">
        <p className="text-sm text-muted">{LISTING_TYPE_LABEL[listing.type]}</p>
        <h3 className="line-clamp-2 text-base font-semibold">
          <Link
            to={to}
            viewTransition={supportsViewTransition()}
            className="outline-none after:absolute after:inset-0"
            style={moving ? { viewTransitionName: 'listing-title' } : undefined}
          >
            {listing.title}
          </Link>
        </h3>
        <p className="font-semibold break-words tabular-nums">{formatPrice(listing.price, listing.priceUnit)}</p>
        <p className="flex items-center gap-1 text-sm text-muted">
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{listing.district}</span>
        </p>
      </div>
      {action && <div className="absolute top-2 right-2 z-10">{action}</div>}
    </article>
  );
}
