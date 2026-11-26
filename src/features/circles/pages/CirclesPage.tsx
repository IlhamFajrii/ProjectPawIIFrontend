import { useQuery } from '@tanstack/react-query';
import { ChevronRight, LogIn, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../../../components/ui/Button';
import { Page } from '../../../components/ui/Page';
import { LoadingBlock } from '../../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../../components/ui/States';
import { getMyCircles } from '../../../lib/api/circles';
import { queryKeys } from '../../../lib/queryKeys';
import { CircleDialog, type CircleMode } from '../components/CircleDialog';

export default function CirclesPage() {
  const [dialog, setDialog] = useState<{ open: boolean; mode: CircleMode }>({ open: false, mode: 'create' });
  const circles = useQuery({ queryKey: queryKeys.circles, queryFn: ({ signal }) => getMyCircles(signal) });
  const show = (mode: CircleMode) => setDialog({ open: true, mode });

  const buttons = (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => show('create')}>
        <Plus className="size-5" aria-hidden="true" />
        Buat circle
      </Button>
      <Button variant="secondary" onClick={() => show('join')}>
        <LogIn className="size-5" aria-hidden="true" />
        Gabung
      </Button>
    </div>
  );

  return (
    <Page
      title="Circle"
      intro="Circle adalah kelompok orang yang saling kenal, misalnya RT, kampus, atau komunitas. Anggotanya bisa saling memberi vouch."
      width="narrow"
      actions={circles.data?.length ? buttons : undefined}
    >
      {circles.isPending ? (
        <LoadingBlock label="Memuat circle" />
      ) : !circles.data ? (
        <ErrorState error={circles.error} onRetry={() => void circles.refetch()} />
      ) : circles.data.length === 0 ? (
        <EmptyState icon={Users} title="Kamu belum punya circle" action={buttons}>
          Buat circle baru, atau gabung dengan kode undangan dari temanmu.
        </EmptyState>
      ) : (
        <ul className="stagger grid gap-3">
          {circles.data.map((circle) => (
            <li key={circle._id}>
              <Link to={`/circle/${circle._id}`} className="pressable flex min-h-18 items-center gap-4 rounded-card bg-surface p-4">
                <Users className="size-6 shrink-0 text-accent" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-h3">{circle.name}</span>
                  <span className="block text-sm text-muted">{circle.members.length} anggota</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <CircleDialog open={dialog.open} initialMode={dialog.mode} onClose={() => setDialog((state) => ({ ...state, open: false }))} />
    </Page>
  );
}
