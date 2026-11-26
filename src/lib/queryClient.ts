import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api/client';

const PUBLIC_KEYS = new Set<unknown>(['listings', 'listing', 'profile']);

/**
 * Membuang cache saat sesi berganti. Query publik yang sedang tampil dibiarkan:
 * membuangnya membuat layar tersangkut di keadaan memuat. `clear()` jangan dipakai.
 */
export function dropSessionCache(queryClient: QueryClient) {
  queryClient.removeQueries({
    predicate: (query) => !(query.isActive() && PUBLIC_KEYS.has(query.queryKey[0])),
  });
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Hanya gangguan sementara yang dicoba ulang.
        retry: (failures, error) =>
          failures < 1 && error instanceof ApiError && (error.status === 0 || error.status >= 500),
      },
      // POST, PUT, DELETE tidak pernah diulang otomatis.
      mutations: { retry: false },
    },
  });
}
