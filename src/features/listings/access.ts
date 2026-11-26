import type { Listing } from '../../lib/api/types';
import { idOf } from '../../lib/url';

/** Tombol mana yang tampil di detail listing (FR-L4). Tamu boleh menekan, lalu diminta masuk. */
export function listingAccess(listing: Listing, userId?: string) {
  const isOwner = userId !== undefined && idOf(listing.owner) === userId;
  let orderBlock: string | null = null;
  if (listing.status === 'RESERVED') orderBlock = 'Sedang dipesan orang lain.';
  else if (listing.status === 'SOLD') orderBlock = 'Sudah terjual.';
  else if (listing.status === 'INACTIVE') orderBlock = 'Listing ini sudah dinonaktifkan.';
  return { isOwner, orderBlock };
}
