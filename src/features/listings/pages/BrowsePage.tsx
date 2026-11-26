import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Eye, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { ListingCard } from '../../../components/listing/ListingCard';
import { ListingGridSkeleton } from '../../../components/listing/ListingGridSkeleton';
import { Button } from '../../../components/ui/Button';
import { buttonClass, iconButtonClass } from '../../../components/ui/buttonClass';
import { Chip } from '../../../components/ui/Chip';
import { Dialog } from '../../../components/ui/Dialog';
import { TextField } from '../../../components/ui/Field';
import { Page } from '../../../components/ui/Page';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState, ErrorState } from '../../../components/ui/States';
import { getListings } from '../../../lib/api/listings';
import { LISTING_TYPE_LABEL } from '../../../lib/constants';
import { formatRupiah } from '../../../lib/format';
import { useDebounced, useMediaQuery } from '../../../lib/hooks';
import { queryKeys } from '../../../lib/queryKeys';
import { FilterFields } from '../components/FilterFields';
import { QuickViewDialog } from '../components/QuickViewDialog';
import { draftFrom, FILTER_NAMES, parseFilters, withParams, type FilterDraft, type FilterName } from '../filters';

const GRID = 'grid grid-cols-1 gap-x-4 gap-y-8 min-[26rem]:grid-cols-2 xl:grid-cols-3';

function SearchBox({ value, onSearch }: { value: string; onSearch: (value: string) => void }) {
  const [text, setText] = useState(value);
  const [synced, setSynced] = useState(value);
  const debounced = useDebounced(text, 300);

  // Back dan forward mengubah URL: samakan isi kotak cari.
  if (value !== synced) {
    setSynced(value);
    if (value !== text.trim()) setText(value);
  }

  useEffect(() => {
    // Hanya nilai yang sudah tenang dan masih sama dengan yang diketik yang dikirim.
    if (debounced === text && debounced.trim() !== value) onSearch(debounced.trim());
  }, [debounced, text, value, onSearch]);

  return (
    <form
      role="search"
      className="relative min-w-0 flex-1"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(text.trim());
      }}
    >
      <TextField
        label="Cari listing"
        type="search"
        value={text}
        maxLength={100}
        enterKeyHint="search"
        placeholder="Misalnya tenda atau servis AC"
        onChange={(event) => setText(event.target.value)}
        className="pl-10"
      />
      <Search className="pointer-events-none absolute bottom-3 left-3 size-5 text-muted" aria-hidden="true" />
    </form>
  );
}

function chipLabel(name: FilterName, value: string) {
  if (name === 'type') return LISTING_TYPE_LABEL[value as keyof typeof LISTING_TYPE_LABEL];
  if (name === 'minPrice') return `Min ${formatRupiah(Number(value))}`;
  if (name === 'maxPrice') return `Maks ${formatRupiah(Number(value))}`;
  return value;
}

export default function BrowsePage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [filterOpen, setFilterOpen] = useState(false);
  const desktop = useMediaQuery('(min-width: 1024px)');
  const filters = parseFilters(params);
  const draft = draftFrom(filters);
  const active = FILTER_NAMES.filter((name) => draft[name] !== '');
  const hasCriteria = active.length > 0 || filters.q !== undefined;

  const listings = useQuery({
    queryKey: queryKeys.listings(filters),
    queryFn: ({ signal }) => getListings(filters, signal),
    placeholderData: keepPreviousData,
  });
  const categories = [...new Set(listings.data?.items.map((item) => item.category))].sort();

  const update = (changes: Record<string, string | undefined>, replace = false) =>
    setParams(withParams(params, changes), { replace, preventScrollReset: true });
  const apply = (next: FilterDraft) => {
    setFilterOpen(false);
    update({ ...next });
  };
  const reset = () => setParams(new URLSearchParams(), { preventScrollReset: true });

  const quickView = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('lihat', id);
    setParams(next, { preventScrollReset: true, state: { quickView: true } });
  };
  const closeQuickView = () => {
    // Dibuka dari grid: mundur satu langkah, sama seperti tombol back.
    if ((location.state as { quickView?: boolean } | null)?.quickView) return void navigate(-1);
    const next = new URLSearchParams(params);
    next.delete('lihat');
    setParams(next, { replace: true, preventScrollReset: true });
  };

  const fields = (
    <FilterFields key={JSON.stringify(draft)} initial={draft} categories={categories} onApply={apply} />
  );

  return (
    <Page title="Jelajah">
      <div className="flex items-end gap-2">
        <SearchBox value={filters.q ?? ''} onSearch={(q) => update({ q }, true)} />
        {!desktop && (
          <Button variant="secondary" onClick={() => setFilterOpen(true)}>
            <SlidersHorizontal className="size-5" aria-hidden="true" />
            Filter{active.length > 0 ? ` (${active.length})` : ''}
          </Button>
        )}
      </div>

      {active.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {active.map((name) => (
            <Chip key={name} label={chipLabel(name, draft[name])} onRemove={() => update({ [name]: undefined })} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
        {desktop && (
          <aside aria-label="Filter" className="self-start">
            {fields}
          </aside>
        )}
        <section aria-labelledby="hasil" aria-busy={listings.isFetching} className="min-w-0">
          <h2 id="hasil" className="sr-only">
            Hasil pencarian
          </h2>
          <p className="pb-4 text-sm text-muted" role="status">
            {listings.data ? `${listings.data.total} listing ditemukan` : ' '}
          </p>
          {listings.isPending ? (
            <ListingGridSkeleton className={GRID} />
          ) : !listings.data ? (
            <ErrorState error={listings.error} onRetry={() => void listings.refetch()} />
          ) : listings.data.items.length === 0 ? (
            listings.data.total > 0 ? (
              <EmptyState
                title="Halaman ini kosong"
                action={<Button onClick={() => update({ page: undefined })}>Ke halaman 1</Button>}
              />
            ) : hasCriteria ? (
              <EmptyState title="Tidak ada listing yang cocok" action={<Button onClick={reset}>Reset filter</Button>}>
                Coba kata kunci lain atau longgarkan filter.
              </EmptyState>
            ) : (
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
            )
          ) : (
            <>
              <ul className={`stagger ${GRID} ${listings.isPlaceholderData ? 'opacity-60' : ''}`}>
                {listings.data.items.map((listing) => (
                  <li key={listing._id}>
                    <ListingCard
                      listing={listing}
                      action={
                        <button
                          type="button"
                          className={`${iconButtonClass} border border-line bg-bg`}
                          aria-label={`Lihat cepat ${listing.title}`}
                          onClick={() => quickView(listing._id)}
                        >
                          <Eye className="size-5" aria-hidden="true" />
                        </button>
                      }
                    />
                  </li>
                ))}
              </ul>
              <Pagination
                page={listings.data.page}
                limit={listings.data.limit}
                total={listings.data.total}
                onChange={(page) => {
                  setParams(withParams(params, { page: String(page) }));
                }}
              />
            </>
          )}
        </section>
      </div>

      <Dialog open={filterOpen && !desktop} onClose={() => setFilterOpen(false)} title="Filter" lightDismiss>
        {fields}
      </Dialog>
      <QuickViewDialog id={params.get('lihat')} onClose={closeQuickView} />
    </Page>
  );
}
