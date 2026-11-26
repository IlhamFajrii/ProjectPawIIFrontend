import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

/**
 * Setelah aksi pesanan atau sengketa, semua data terkait dimuat ulang.
 * Respons aksi tidak membawa data pembeli dan penjual, jadi cache detail tidak ditimpa.
 */
export function invalidateOrderData(queryClient: QueryClient, orderId?: string, listingId?: string) {
  const keys: readonly (readonly unknown[])[] = [
    queryKeys.orders(),
    orderId ? queryKeys.order(orderId) : ['order'],
    queryKeys.disputes(),
    ['dispute'],
    listingId ? queryKeys.listing(listingId) : ['listing'],
    queryKeys.listings(),
    queryKeys.myListings(),
  ];
  return Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}
