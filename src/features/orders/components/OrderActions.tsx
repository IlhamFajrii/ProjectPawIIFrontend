import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { ApiError } from '../../../lib/api/client';
import { findDisputeByOrder } from '../../../lib/api/disputes';
import { transitionOrder, type OrderRole, type OrderTransition } from '../../../lib/api/orders';
import type { Order } from '../../../lib/api/types';
import { formatRupiah } from '../../../lib/format';
import { errorMessage } from '../../../lib/formErrors';
import { invalidateOrderData } from '../../../lib/invalidate';
import { getOrderActions, ORDER_ACTION_LABEL, type OrderAction } from '../../../lib/orderActions';
import { useToast } from '../../../lib/toast';
import { ACTION_COPY } from '../actionCopy';
import { OpenDisputeDialog } from './OpenDisputeDialog';

export function OrderActions({ order, role }: { order: Order; role: OrderRole }) {
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<OrderTransition>('pay');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const sending = useRef(false);
  const actions = getOrderActions(order.status, role);
  const copy = ACTION_COPY[pending];

  const transition = useMutation({
    mutationFn: (action: OrderTransition) => transitionOrder(order._id, action),
    onSuccess: async (_data, action) => {
      await invalidateOrderData(queryClient, order._id, order.listing);
      setConfirmOpen(false);
      toast.success(ACTION_COPY[action].success);
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 409) {
        // Tampilkan pesan server, lalu muat data terbaru (FR-O6).
        setConfirmOpen(false);
        toast.error(error.message);
        await invalidateOrderData(queryClient, order._id, order.listing);
      }
    },
    onSettled: () => {
      sending.current = false;
    },
  });

  const viewDispute = useMutation({ mutationFn: () => findDisputeByOrder(order._id) });

  // Callback milik mutate() tidak dipanggil bila halaman sudah ditinggalkan.
  const openCurrentDispute = () =>
    viewDispute.mutate(undefined, {
      onSuccess: (dispute) => {
        if (dispute) void navigate(`/sengketa/${dispute._id}`);
        else toast.error('Sengketa pesanan ini tidak ditemukan. Muat ulang halaman lalu coba lagi.');
      },
      onError: (error) => toast.error(errorMessage(error)),
    });

  const start = (action: OrderAction) => {
    if (action === 'dispute') setDisputeOpen(true);
    else if (action === 'viewDispute') openCurrentDispute();
    else {
      transition.reset();
      setPending(action);
      setConfirmOpen(true);
    }
  };

  const secondary: OrderAction[] = ['cancel', 'dispute'];

  return (
    <>
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {actions.map((action) => (
            <Button
              key={action}
              variant={secondary.includes(action) ? 'secondary' : 'primary'}
              disabled={transition.isPending}
              loading={action === 'viewDispute' && viewDispute.isPending}
              onClick={() => start(action)}
            >
              {ORDER_ACTION_LABEL[action]}
            </Button>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={copy.title}
        confirmLabel={copy.confirm}
        cancelLabel={pending === 'cancel' ? 'Jangan batalkan' : 'Batal'}
        destructive={copy.destructive}
        busy={transition.isPending}
        error={transition.error ? errorMessage(transition.error) : undefined}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (sending.current) return;
          sending.current = true;
          transition.mutate(pending);
        }}
      >
        {pending === 'pay' && (
          <>
            <p className="text-h2 text-ink tabular-nums">{formatRupiah(order.amount)}</p>
            <p className="rounded-input border-2 border-warning p-3 font-semibold text-warning">
              Simulasi: tidak ada uang yang berpindah
            </p>
          </>
        )}
        <p>{copy.body}</p>
      </ConfirmDialog>

      <OpenDisputeDialog order={order} open={disputeOpen} onClose={() => setDisputeOpen(false)} />
    </>
  );
}
