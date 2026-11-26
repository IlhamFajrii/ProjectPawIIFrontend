import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getMe } from '../lib/api/auth';
import { setUnauthorizedHandler } from '../lib/api/client';
import type { User } from '../lib/api/types';
import { dropSessionCache } from '../lib/queryClient';
import { queryKeys } from '../lib/queryKeys';
import { SessionContext, type AuthMode, type Session } from '../lib/session';
import { readToken, TOKEN_KEY, writeToken } from '../lib/token';

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(readToken);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  // Dipasang saat render pertama selesai, sebelum query mana pun sempat menjawab.
  useEffect(() => {
    setUnauthorizedHandler((usedToken) => {
      // Jawaban terlambat dari sesi lama tidak boleh mengakhiri sesi baru.
      if (!usedToken || usedToken !== readToken()) return;
      writeToken(null);
      setToken(null);
      dropSessionCache(queryClient);
      setAuthMode('login');
    });
    return () => setUnauthorizedHandler(null);
  }, [queryClient]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== TOKEN_KEY) return;
      dropSessionCache(queryClient);
      setToken(readToken());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [queryClient]);

  const me = useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => getMe(signal),
    enabled: token !== null,
    staleTime: 5 * 60_000,
  });

  const signIn = useCallback(
    (nextToken: string, user: User) => {
      dropSessionCache(queryClient);
      writeToken(nextToken);
      queryClient.setQueryData(queryKeys.me, user);
      setToken(nextToken);
    },
    [queryClient],
  );

  const signOut = useCallback(() => {
    writeToken(null);
    setToken(null);
    dropSessionCache(queryClient);
  }, [queryClient]);

  const openAuth = useCallback((mode: AuthMode = 'login') => setAuthMode(mode), []);
  const closeAuth = useCallback(() => setAuthMode(null), []);

  const user = token ? me.data : undefined;
  const status: Session['status'] = !token ? 'guest' : user ? 'authed' : me.isError ? 'error' : 'loading';
  const { error, refetch } = me;

  const value = useMemo<Session>(
    () => ({
      status,
      user,
      error,
      retry: () => void refetch(),
      signIn,
      signOut,
      authMode,
      openAuth,
      closeAuth,
    }),
    [status, user, error, refetch, signIn, signOut, authMode, openAuth, closeAuth],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}
