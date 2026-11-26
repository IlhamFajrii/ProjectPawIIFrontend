import { Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Button } from '../components/ui/Button';
import { LoadingBlock } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/States';
import { useTitle } from '../lib/hooks';
import { useSession } from '../lib/session';

/** URL tidak berubah, jadi setelah masuk pengguna langsung berada di tujuan semula (FR-A4). */
function Gate({ autoOpen }: { autoOpen: boolean }) {
  const { openAuth } = useSession();
  useTitle('Masuk untuk melanjutkan');
  useEffect(() => {
    if (autoOpen) openAuth('login');
  }, [autoOpen, openAuth]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="sr-only">Masuk untuk melanjutkan</h1>
      <EmptyState
        icon={Lock}
        title="Masuk untuk melanjutkan"
        action={<Button onClick={() => openAuth('login')}>Masuk atau daftar</Button>}
      >
        Halaman ini hanya untuk pengguna yang sudah masuk.
      </EmptyState>
    </div>
  );
}

/** Penjagaan di klien hanya untuk kenyamanan; otorisasi ada di server. */
export function RequireAuth() {
  const { status, error, retry } = useSession();
  const { pathname } = useLocation();
  const [authedAt, setAuthedAt] = useState<string>();
  if (status === 'authed' && authedAt !== pathname) setAuthedAt(pathname);

  if (status === 'authed') return <Outlet />;
  // Popup hanya dibuka untuk tamu yang baru datang. Orang yang baru saja keluar tidak diganggu,
  // dan sesi yang berakhir (401) sudah membuka popup dari SessionProvider.
  if (status === 'guest') return <Gate key={pathname} autoOpen={authedAt !== pathname} />;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      {status === 'loading' ? <LoadingBlock label="Memulihkan sesi" /> : <ErrorState error={error} onRetry={retry} />}
    </div>
  );
}
