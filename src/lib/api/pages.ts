import type { Paginated } from './types';

export const MAX_LIMIT = 50;
const MAX_PAGES = 100;

/** Menelusuri halaman demi halaman sampai item yang dicari ditemukan. */
export async function findAcrossPages<T>(
  load: (page: number) => Promise<Paginated<T>>,
  matches: (item: T) => boolean,
): Promise<T | null> {
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await load(page);
    const found = result.items.find(matches);
    if (found) return found;
    if (result.items.length === 0 || page * result.limit >= result.total) return null;
  }
  return null;
}
