import { CircleAlert } from 'lucide-react';
import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/States';
import { useTitle } from '../lib/hooks';

/** Error boundary rute: termasuk potongan halaman yang gagal diunduh. */
export function RouteError() {
  const error = useRouteError();
  useTitle('Terjadi kesalahan');
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="sr-only">Terjadi kesalahan</h1>
      <EmptyState
        role="alert"
        icon={CircleAlert}
        title="Halaman gagal ditampilkan"
        action={<Button onClick={() => window.location.reload()}>Muat ulang</Button>}
      >
        Periksa koneksi, lalu muat ulang halaman.
      </EmptyState>
    </div>
  );
}
