import type { UseQueryResult } from '@tanstack/react-query';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router';
import { ListingCard } from '../../../components/listing/ListingCard';
import { ListingGridSkeleton } from '../../../components/listing/ListingGridSkeleton';
import { buttonClass, iconButtonClass } from '../../../components/ui/buttonClass';
import { EmptyState, ErrorState } from '../../../components/ui/States';
import type { Listing, Paginated } from '../../../lib/api/types';

export function LatestRail({ latest }: { latest: UseQueryResult<Paginated<Listing>> }) {
  const rail = useRef<HTMLUListElement>(null);
  const slide = (direction: -1 | 1) => {
    const element = rail.current;
    if (!element) return;
    const smooth = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
    element.scrollBy({ left: direction * element.clientWidth * 0.8, behavior: smooth ? 'smooth' : 'auto' });
  };
  const hasItems = Boolean(latest.data?.items.length);

  return (
    <section aria-labelledby="terbaru" className="py-section">
      <div className="mx-auto grid w-full max-w-page grid-cols-1 gap-8 px-4 md:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="terbaru" className="reveal text-h1">
            Listing terbaru
          </h2>
          <div className="flex items-center gap-2">
            {hasItems && (
              <div className="hidden gap-1 md:flex">
                <button
                  type="button"
                  className={`${iconButtonClass} border border-control`}
                  onClick={() => slide(-1)}
                  aria-label="Geser listing ke kiri"
                >
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={`${iconButtonClass} border border-control`}
                  onClick={() => slide(1)}
                  aria-label="Geser listing ke kanan"
                >
                  <ChevronRight className="size-5" aria-hidden="true" />
                </button>
              </div>
            )}
            <Link to="/jelajah" className={buttonClass('text')}>
              Lihat semua
              <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
        {latest.isPending ? (
          <ListingGridSkeleton count={4} className="rail" />
        ) : !latest.data ? (
          <ErrorState error={latest.error} onRetry={() => void latest.refetch()} />
        ) : latest.data.items.length === 0 ? (
          <EmptyState
            title="Belum ada listing"
            action={
              <Link to="/jual" className={buttonClass()}>
                Pasang listing
              </Link>
            }
          >
            Jadilah yang pertama menawarkan barang atau jasa di sini.
          </EmptyState>
        ) : (
          // Bisa difokus agar tombol panah menggeser rail.
          <ul ref={rail} className="rail rail-focus" tabIndex={0} aria-label="Listing terbaru, bisa digeser ke samping">
            {latest.data.items.map((listing) => (
              <li key={listing._id}>
                <ListingCard listing={listing} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
