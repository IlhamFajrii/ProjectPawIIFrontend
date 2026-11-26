import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';
import type { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { useRequestClose } from '../../../components/ui/dialogContext';
import { TextareaField, TextField } from '../../../components/ui/Field';
import { FormSummary } from '../../../components/ui/FormSummary';
import { createOrder } from '../../../lib/api/orders';
import type { Listing } from '../../../lib/api/types';
import { ESCROW_NOTICE, QUANTITY_LABEL } from '../../../lib/constants';
import { formatPrice, formatRupiah } from '../../../lib/format';
import { applyServerErrors, flattenErrors } from '../../../lib/formErrors';
import { queryKeys } from '../../../lib/queryKeys';
import { useToast } from '../../../lib/toast';
import { zodResolver } from '../../../lib/zodResolver';
import { orderSchema } from '../orderSchema';

type Input = z.input<typeof orderSchema>;
const LABELS = { quantity: 'Jumlah', note: 'Catatan' };

interface Props {
  listing: Listing;
  open: boolean;
  onClose: () => void;
}

function CancelButton({ disabled }: { disabled: boolean }) {
  const requestClose = useRequestClose();
  return (
    <Button variant="secondary" onClick={requestClose} disabled={disabled}>
      Batal
    </Button>
  );
}

/** PU-05. */
export function CreateOrderDialog({ listing, open, onClose }: Props) {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string>();
  const sending = useRef(false);
  const single = listing.type === 'BARANG';
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    reset,
    control,
    formState: { errors, dirtyFields },
  } = useForm<Input, unknown, z.output<typeof orderSchema>>({
    resolver: zodResolver(orderSchema),
    defaultValues: { quantity: '1', note: '' },
  });
  const quantity = Number(useWatch({ control, name: 'quantity' }));
  const total = Number.isInteger(quantity) && quantity >= 1 && quantity <= 365 ? listing.price * quantity : null;

  const close = () => {
    setMessage(undefined);
    reset();
    onClose();
  };

  const order = useMutation({
    mutationFn: createOrder,
    onSuccess: async (created) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.listing(listing._id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.listings() });
      toast.success('Pesanan dibuat. Lanjutkan dengan membayar.');
      // Dialog tetap terkunci sampai halaman pesanan siap.
      await navigate(`/pesanan/${created._id}`);
      close();
    },
    onError: (error) => {
      setMessage(applyServerErrors<Input>(error, setError, Object.keys(LABELS)));
      void queryClient.invalidateQueries({ queryKey: queryKeys.listing(listing._id) });
    },
    onSettled: () => {
      sending.current = false;
    },
  });

  const send = (values: z.output<typeof orderSchema>) => {
    // Penjaga tambahan agar dua klik cepat tidak mengirim dua pesanan.
    if (sending.current) return;
    sending.current = true;
    setMessage(undefined);
    order.mutate({
      listingId: listing._id,
      quantity: single ? 1 : values.quantity,
      ...(values.note ? { note: values.note } : {}),
    });
  };

  return (
    <Dialog open={open} onClose={close} title="Buat pesanan" lightDismiss dirty={Boolean(dirtyFields.note)} busy={order.isPending}>
      <form noValidate className="grid gap-4" onSubmit={(event) => void handleSubmit(send)(event)}>
        <div>
          <p className="font-semibold break-words">{listing.title}</p>
          <p className="text-muted tabular-nums">{formatPrice(listing.price, listing.priceUnit)}</p>
        </div>
        <FormSummary message={message} errors={flattenErrors(errors)} labels={LABELS} onSelect={(name) => setFocus(name as keyof Input)} />
        <TextField
          {...register('quantity')}
          label={QUANTITY_LABEL[listing.priceUnit]}
          type="number"
          inputMode="numeric"
          min={1}
          max={365}
          readOnly={single}
          hint={single ? 'Barang dipesan satu per satu.' : 'Antara 1 dan 365.'}
          data-autofocus={single ? undefined : ''}
          error={errors.quantity?.message}
        />
        <TextareaField
          {...register('note')}
          label="Catatan (opsional)"
          maxLength={500}
          rows={3}
          data-autofocus={single ? '' : undefined}
          error={errors.note?.message}
        />
        <p className="flex items-baseline justify-between gap-3 border-t border-line pt-3" aria-live="polite">
          <span>Total</span>
          <span className="text-h2 tabular-nums">{total === null ? '–' : formatRupiah(total)}</span>
        </p>
        <p className="text-sm text-muted">{ESCROW_NOTICE}</p>
        <div className="flex flex-wrap justify-end gap-2">
          <CancelButton disabled={order.isPending} />
          <Button type="submit" loading={order.isPending}>
            Buat pesanan
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
