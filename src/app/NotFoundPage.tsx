import { NotFoundState } from '../components/ui/States';
import { useTitle } from '../lib/hooks';

export default function NotFoundPage() {
  useTitle('Halaman tidak ditemukan');
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <h1 className="sr-only">404</h1>
      <NotFoundState />
    </div>
  );
}
