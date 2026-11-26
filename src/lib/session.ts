import { createContext, useContext } from 'react';
import type { User } from './api/types';

export type AuthMode = 'login' | 'register';

export interface Session {
  status: 'guest' | 'loading' | 'authed' | 'error';
  user?: User;
  error: Error | null;
  retry: () => void;
  signIn: (token: string, user: User) => void;
  signOut: () => void;
  authMode: AuthMode | null;
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
}

export const SessionContext = createContext<Session | null>(null);

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession harus dipakai di dalam SessionProvider');
  return session;
}

/** Untuk halaman di balik RequireAuth, tempat pengguna pasti sudah masuk. */
export function useCurrentUser() {
  const { user } = useSession();
  if (!user) throw new Error('useCurrentUser hanya untuk halaman yang dijaga');
  return user;
}
