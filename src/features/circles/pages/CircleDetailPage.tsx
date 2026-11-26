import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Copy, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Page } from '../../../components/ui/Page';
import { LoadingBlock } from '../../../components/ui/Skeleton';
import { LoadError } from '../../../components/ui/States';
import { getCircle, leaveCircle } from '../../../lib/api/circles';
import { errorMessage } from '../../../lib/formErrors';
import { queryKeys } from '../../../lib/queryKeys';
import { useCurrentUser } from '../../../lib/session';
import { useToast } from '../../../lib/toast';
import { MemberSheet } from '../components/MemberSheet';

export default function CircleDetailPage() {
  const { id = '' } = useParams();
  const me = useCurrentUser();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string>();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const circle = useQuery({
    queryKey: queryKeys.circle(id),
    queryFn: ({ signal }) => getCircle(id, signal),
    // Setelah keluar, server menjawab 403; jangan diambil ulang.
    refetchOnWindowFocus: false,
  });

  const leave = useMutation({
    mutationFn: () => leaveCircle(id),
    onSuccess: async () => {
      setLeaving(false);
      await navigate('/circle', { replace: true });
      queryClient.removeQueries({ queryKey: queryKeys.circle(id) });
      queryClient.removeQueries({ queryKey: queryKeys.vouched(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.circles });
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Kamu keluar dari circle.');
    },
  });

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Kode undangan disalin.');
    } catch {
      toast.error('Kode gagal disalin. Pilih kodenya lalu salin manual.');
    }
  };

  const data = circle.data;

  return (
    <Page title={data?.name ?? 'Circle'} width="narrow">
      {circle.isPending ? (
        <LoadingBlock label="Memuat circle" />
      ) : !data ? (
        <LoadError error={circle.error} onRetry={() => void circle.refetch()} notFound="Circle tidak ditemukan" />
      ) : (
        <>
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Kode undangan</p>
              <p className="text-h2 break-all select-all tabular-nums">{data.inviteCode}</p>
            </div>
            <Button variant="secondary" onClick={() => void copy(data.inviteCode)}>
              <Copy className="size-5" aria-hidden="true" />
              Salin kode
            </Button>
          </Card>

          <section aria-labelledby="anggota" className="grid gap-3">
            <h2 id="anggota" className="text-h2">
              {data.members.length} anggota
            </h2>
            <ul className="stagger grid gap-2">
              {data.members.map((member) => (
                <li key={member.user._id}>
                  <button
                    type="button"
                    className="pressable flex min-h-16 w-full items-center gap-3 rounded-card bg-surface p-3 text-left"
                    onClick={() => {
                      setSelected(member.user._id);
                      setSheetOpen(true);
                    }}
                  >
                    <Avatar name={member.user.name} src={member.user.avatarUrl} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">
                        {member.user.name}
                        {member.user._id === me._id && ' (kamu)'}
                      </span>
                      <span className="block text-sm text-muted">
                        {member.user.district} · {member.vouchCount} total vouch
                      </span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <Button
            variant="secondary"
            className="justify-self-start"
            onClick={() => {
              leave.reset();
              setLeaving(true);
            }}
          >
            <LogOut className="size-5" aria-hidden="true" />
            Keluar dari circle
          </Button>

          <MemberSheet
            circleId={id}
            member={data.members.find((member) => member.user._id === selected)}
            self={selected === me._id}
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
          />

          {/* PU-14 */}
          <ConfirmDialog
            open={leaving}
            title="Keluar dari circle?"
            confirmLabel="Keluar"
            destructive
            busy={leave.isPending}
            error={leave.error ? errorMessage(leave.error) : undefined}
            onConfirm={() => leave.mutate()}
            onClose={() => setLeaving(false)}
          >
            <p>Vouch yang kamu beri dan terima di circle ini ikut tercabut.</p>
            {data.members.length === 1 && (
              <p className="font-medium text-warning">Kamu anggota terakhir, jadi circle ini akan dihapus.</p>
            )}
            {data.members.length > 1 && <p>Circle yang tidak punya anggota akan dihapus.</p>}
          </ConfirmDialog>
        </>
      )}
    </Page>
  );
}
