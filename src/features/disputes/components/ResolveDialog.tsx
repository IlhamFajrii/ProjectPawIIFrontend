import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { useRequestClose } from '../../../components/ui/dialogContext';
import { TextareaField } from '../../../components/ui/Field';
import { ApiError } from '../../../lib/api/client';
import { resolveDispute } from '../../../lib/api/disputes';
import type { DisputeResolution, Order } from '../../../lib/api/types';
import { DISPUTE_RESOLUTION_LABEL, DISPUTE_RESOLUTIONS } from '../../../lib/constants';
import { formatRupiah } from '../../../lib/format';
import { errorMessage } from '../../../lib/formErrors';
import { invalidateOrderData } from '../../../lib/invalidate';
import { useToast } from '../../../lib/toast';

interface Props {
  disputeId: string;
  order: Order;
  open: boolean;
  onClose: () => void;
}

function CancelButton() {
  const requestClose = useRequestClose();
  return (
    <Button variant="secondary" onClick={requestClose}>
      Batal
    </Button>
  );
}

/** PU-09: putusan admin dalam dua langkah. */
export function ResolveDialog({ disputeId, order, open, onClose }: Props) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const groupName = useId();
  const [resolution, setResolution] = useState<DisputeResolution | null>(null);
  const [note, setNote] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [missing, setMissing] = useState(false);

  const close = () => {
    setResolution(null);
    setNote('');
    setStep(1);
    setMissing(false);
    onClose();
  };

  const resolve = useMutation({
    mutationFn: (value: DisputeResolution) =>
      resolveDispute(disputeId, { resolution: value, ...(note.trim() ? { adminNote: note.trim() } : {}) }),
    onSuccess: () => {
      toast.success('Putusan tersimpan.');
      close();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error(error.message);
        close();
      }
    },
    onSettled: () => invalidateOrderData(queryClient, order._id, order.listing),
  });

  return (
    <Dialog
      open={open}
      onClose={close}
      title={step === 1 ? 'Putuskan sengketa' : 'Konfirmasi putusan'}
      dirty={resolution !== null || note !== ''}
      busy={resolve.isPending}
    >
      {step === 1 ? (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!resolution) return setMissing(true);
            resolve.reset();
            setStep(2);
          }}
        >
          <fieldset className="grid gap-2" aria-describedby={missing && !resolution ? `${groupName}-error` : undefined}>
            <legend className="mb-1 text-sm font-medium">Putusan</legend>
            {DISPUTE_RESOLUTIONS.map((value, index) => (
              <label
                key={value}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-input border border-control px-3 has-checked:border-2 has-checked:border-accent"
              >
                <input
                  type="radio"
                  name={groupName}
                  className="size-5 accent-accent"
                  checked={resolution === value}
                  onChange={() => setResolution(value)}
                  data-autofocus={index === 0 ? '' : undefined}
                />
                <span>{DISPUTE_RESOLUTION_LABEL[value]}</span>
              </label>
            ))}
            {missing && !resolution && (
              <p id={`${groupName}-error`} role="alert" className="text-sm font-medium text-danger">
                Pilih salah satu putusan.
              </p>
            )}
          </fieldset>
          <TextareaField
            label="Catatan admin (opsional)"
            value={note}
            maxLength={2000}
            onChange={(event) => setNote(event.target.value)}
            hint="Terlihat oleh pembeli dan penjual."
          />
          <div className="flex flex-wrap justify-end gap-2">
            <CancelButton />
            <Button type="submit">Lanjut</Button>
          </div>
        </form>
      ) : (
        resolution && (
          <div className="grid gap-4">
            <p>
              Pesanan <strong className="break-words">{order.orderCode}</strong> senilai{' '}
              <strong>{formatRupiah(order.amount)}</strong>.
            </p>
            <p className="text-h3">{DISPUTE_RESOLUTION_LABEL[resolution]}</p>
            {note.trim() && <p className="break-words whitespace-pre-line text-muted">{note.trim()}</p>}
            <p className="font-medium text-warning">Putusan tidak bisa diubah setelah dikirim.</p>
            {resolve.error && (
              <p role="alert" className="font-medium text-danger">
                {errorMessage(resolve.error)}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => setStep(1)} disabled={resolve.isPending} autoFocus>
                Kembali
              </Button>
              <Button loading={resolve.isPending} onClick={() => resolve.mutate(resolution)}>
                Kirim putusan
              </Button>
            </div>
          </div>
        )
      )}
    </Dialog>
  );
}
