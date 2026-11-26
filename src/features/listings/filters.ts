import type { ListingFilters } from '../../lib/api/listings';
import { DISTRICTS, LISTING_TYPES, oneOf } from '../../lib/constants';

export const PAGE_SIZE = 12;

const integer = (value: string | null) => (value && /^\d{1,10}$/.test(value) ? Number(value) : undefined);
const text = (value: string | null, max: number) => value?.trim().slice(0, max) || undefined;

/** URL bisa diketik siapa saja, jadi hanya nilai yang sah yang diteruskan ke API. */
export function parseFilters(params: URLSearchParams) {
  return {
    q: text(params.get('q'), 100),
    type: oneOf(LISTING_TYPES, params.get('type')),
    district: oneOf(DISTRICTS, params.get('district')),
    category: text(params.get('category'), 60)?.toLowerCase(),
    minPrice: integer(params.get('minPrice')),
    maxPrice: integer(params.get('maxPrice')),
    page: Math.max(integer(params.get('page')) ?? 1, 1),
    limit: PAGE_SIZE,
  } satisfies ListingFilters;
}

export const FILTER_NAMES = ['type', 'district', 'category', 'minPrice', 'maxPrice'] as const;
export type FilterName = (typeof FILTER_NAMES)[number];
export type FilterDraft = Record<FilterName, string>;

export const emptyDraft = (): FilterDraft => ({ type: '', district: '', category: '', minPrice: '', maxPrice: '' });

export function draftFrom(filters: ReturnType<typeof parseFilters>): FilterDraft {
  return {
    type: filters.type ?? '',
    district: filters.district ?? '',
    category: filters.category ?? '',
    minPrice: filters.minPrice?.toString() ?? '',
    maxPrice: filters.maxPrice?.toString() ?? '',
  };
}

/** Mengubah parameter URL. Perubahan filter selalu kembali ke halaman 1. */
export function withParams(params: URLSearchParams, changes: Record<string, string | undefined>) {
  const next = new URLSearchParams(params);
  next.delete('lihat');
  if (!('page' in changes)) next.delete('page');
  for (const [name, value] of Object.entries(changes)) {
    if (value) next.set(name, value);
    else next.delete(name);
  }
  if (next.get('page') === '1') next.delete('page');
  return next;
}
