import { CircleAlert, Inbox, Lock, SearchX, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../../lib/api/client';
import { errorMessage } from '../../lib/formErrors';
import { Button } from './Button';
import { buttonClass } from './buttonClass';

interface StateProps {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
  role?: 'status' | 'alert';
}

export function EmptyState({ title, children, action, icon: Icon = Inbox, role = 'status' }: StateProps) {
  return (
    <div role={role} className="grid justify-items-center gap-3 rounded-tile bg-surface px-6 py-12 text-center">
      <Icon className="size-10 text-muted" aria-hidden="true" />
      <h2 className="text-h3">{title}</h2>
      {children && <p className="max-w-prose text-muted">{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <EmptyState
      role="alert"
      icon={CircleAlert}
      title="Data gagal dimuat"
      action={<Button onClick={onRetry}>Coba lagi</Button>}
    >
      {errorMessage(error)}
    </EmptyState>
  );
}

const homeLink = (
  <Link to="/" className={buttonClass('primary')}>
    Ke beranda
  </Link>
);

export function NotFoundState({ title = 'Halaman tidak ditemukan', action = homeLink }: Partial<StateProps>) {
  return (
    <EmptyState icon={SearchX} title={title} action={action}>
      Tautannya mungkin salah, atau datanya sudah tidak tersedia.
    </EmptyState>
  );
}

/** Memilih tampilan gagal berdasarkan kode: 404 atau ID tidak valid, 403, selain itu coba lagi. */
export function LoadError({ error, onRetry, notFound }: { error: unknown; onRetry: () => void; notFound?: string }) {
  const status = error instanceof ApiError ? error.status : undefined;
  if (notFound && (status === 404 || (status === 400 && errorMessage(error) === 'ID tidak valid'))) {
    return <NotFoundState title={notFound} />;
  }
  if (status === 403) {
    return (
      <EmptyState role="alert" icon={Lock} title="Kamu tidak berhak membuka ini" action={homeLink}>
        {errorMessage(error)}
      </EmptyState>
    );
  }
  return <ErrorState error={error} onRetry={onRetry} />;
}
