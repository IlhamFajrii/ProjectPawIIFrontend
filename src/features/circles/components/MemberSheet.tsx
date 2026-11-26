import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ThumbsUp, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { buttonClass } from '../../../components/ui/buttonClass';
import { Dialog } from '../../../components/ui/Dialog';
import { giveVouch, revokeVouch } from '../../../lib/api/circles';
import { ApiError } from '../../../lib/api/client';
import type { CircleMember } from '../../../lib/api/types';
import { errorMessage } from '../../../lib/formErrors';
import { queryKeys } from '../../../lib/queryKeys';

type Action = 'give' | 'revoke';
type Vouched = Record<string, boolean>;

function explain(action: Action, error: unknown) {
  if (error instanceof ApiError && error.status === 409) {
    return 'Kamu sudah memberi vouch ke orang ini, mungkin di circle lain. Vouch hanya bisa dicabut di circle tempat kamu memberikannya.';
  }
  if (action === 'revoke' && error instanceof ApiError && error.status === 404) {
    return 'Tidak ada vouch darimu di circle ini. Kalau kamu memberikannya di circle lain, cabut dari sana.';
  }
  return errorMessage(error);
}

interface Props {
  circleId: string;
  member: CircleMember | undefined;
  self: boolean;
  open: boolean;
  onClose: () => void;
}

/** PU-13. */
export function MemberSheet({ circleId, member, self, open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<{ userId: string; text: string; failed: boolean }>();
  // Backend tidak memberi tahu "sudah saya vouch" (G-08), jadi hasilnya diingat selama sesi.
  const memory = useQuery<Vouched>({
    queryKey: queryKeys.vouched(circleId),
    queryFn: () => ({}),
    initialData: {},
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const userId = member?.user._id ?? '';
  const known = memory.data[userId];

  const remember = (id: string, value: boolean) =>
    queryClient.setQueryData<Vouched>(queryKeys.vouched(circleId), (old) => ({ ...old, [id]: value }));

  const vouch = useMutation({
    mutationFn: ({ action, id }: { action: Action; id: string }) =>
      action === 'give' ? giveVouch(circleId, id) : revokeVouch(circleId, id),
    onSuccess: (_data, { action, id }) => {
      remember(id, action === 'give');
      setNotice({ userId: id, text: action === 'give' ? 'Vouch diberikan.' : 'Vouch dicabut.', failed: false });
    },
    onError: (error, { action, id }) => {
      if (error instanceof ApiError && error.status === 404 && action === 'revoke') remember(id, false);
      setNotice({ userId: id, text: explain(action, error), failed: true });
    },
    onSettled: (_data, _error, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.circle(circleId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile(id) });
    },
  });

  const message = notice?.userId === userId ? notice : undefined;

  return (
    <Dialog
      open={open && member !== undefined}
      onClose={() => {
        setNotice(undefined);
        onClose();
      }}
      title="Anggota circle"
      lightDismiss
      busy={vouch.isPending}
    >
      {member && (
        <div className="grid gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={member.user.name} src={member.user.avatarUrl} size="lg" />
            <div className="min-w-0">
              <p className="text-h3 break-words">{member.user.name}</p>
              <p className="text-sm text-muted">{member.user.district}</p>
              <p className="text-sm font-medium tabular-nums" aria-live="polite">
                {member.vouchCount} total vouch
              </p>
            </div>
          </div>
          {self ? (
            <p className="text-muted">Ini kamu. Vouch hanya bisa diberikan ke anggota lain.</p>
          ) : (
            <>
              <p className="text-sm text-muted">
                Vouch berarti kamu mengenal dan memercayai orang ini. Angkanya dijumlahkan dari semua circle.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  data-autofocus=""
                  disabled={known === true}
                  loading={vouch.isPending && vouch.variables.action === 'give'}
                  onClick={() => vouch.mutate({ action: 'give', id: userId })}
                >
                  <ThumbsUp className="size-5" aria-hidden="true" />
                  Beri vouch
                </Button>
                <Button
                  variant="secondary"
                  disabled={known === false}
                  loading={vouch.isPending && vouch.variables.action === 'revoke'}
                  onClick={() => vouch.mutate({ action: 'revoke', id: userId })}
                >
                  <Undo2 className="size-5" aria-hidden="true" />
                  Cabut vouch
                </Button>
              </div>
            </>
          )}
          {message && (
            <p role={message.failed ? 'alert' : 'status'} className={`font-medium ${message.failed ? 'text-danger' : 'text-success'}`}>
              {message.text}
            </p>
          )}
          <Link to={`/pengguna/${userId}`} className={buttonClass('text', 'justify-self-start')}>
            Lihat profil
          </Link>
        </div>
      )}
    </Dialog>
  );
}
