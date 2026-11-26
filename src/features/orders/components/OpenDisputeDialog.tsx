import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { useRequestClose } from '../../../components/ui/dialogContext';
import { SelectField, TextareaField } from '../../../components/ui/Field';
import { FormSummary } from '../../../components/ui/FormSummary';
import { UrlListFields } from '../../../components/ui/UrlListFields';
import { ApiError } from '../../../lib/api/client';
import { openDispute } from '../../../lib/api/orders';
import type { Order } from '../../../lib/api/types';
import { DISPUTE_REASON_LABEL, DISPUTE_REASONS } from '../../../lib/constants';
import { applyServerErrors, flattenErrors } from '../../../lib/formErrors';
import { invalidateOrderData } from '../../../lib/invalidate';
import { useToast } from '../../../lib/toast';
import { zodResolver } from '../../../lib/zodResolver';
import { disputeSchema } from '../disputeSchema';

type Input = z.input<typeof disputeSchema>;

const LABELS: Record<keyof Input, string> = {
  reason: 'Alasan',
  description: 'Penjelasan',
  evidence: 'Bukti',
};

interface Props {
  order: Order;
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

/** PU-08. */
export function OpenDisputeDialog({ order, open, onClose }: Props) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<Input, unknown, z.output<typeof disputeSchema>>({
    resolver: zodResolver(disputeSchema),
    defaultValues: { reason: '' as Input['reason'], description: '', evidence: [] },
  });
  const evidence = useFieldArray({ control, name: 'evidence' });

  const close = () => {
    setMessage(undefined);
    reset();
    onClose();
  };

  const send = useMutation({
    mutationFn: (values: z.output<typeof disputeSchema>) =>
      openDispute(order._id, { ...values, evidence: values.evidence.map((item) => item.url) }),
    onSuccess: () => {
      toast.success('Sengketa terkirim. Admin akan meninjaunya.');
      close();
    },
    onError: (error) => {
      // 409: status sudah berubah di tempat lain, jadi form ini tidak berlaku lagi.
      if (error instanceof ApiError && error.status === 409) {
        toast.error(error.message);
        close();
      } else {
        setMessage(applyServerErrors<Input>(error, setError, Object.keys(LABELS)));
      }
    },
    onSettled: () => invalidateOrderData(queryClient, order._id, order.listing),
  });

  return (
    <Dialog open={open} onClose={close} title="Ajukan sengketa" dirty={isDirty} busy={send.isPending}>
      <form
        noValidate
        className="grid gap-4"
        onSubmit={handleSubmit((values) => {
          setMessage(undefined);
          send.mutate(values);
        })}
      >
        <p className="text-muted">
          Dana tetap ditahan sampai admin memutuskan: diteruskan ke penjual atau dikembalikan ke pembeli.
        </p>
        <FormSummary message={message} errors={flattenErrors(errors)} labels={LABELS} onSelect={(name) => setFocus(name as 'reason')} />
        <SelectField
          {...register('reason')}
          label={LABELS.reason}
          placeholder="Pilih alasan"
          options={DISPUTE_REASONS.map((value) => ({ value, label: DISPUTE_REASON_LABEL[value] }))}
          data-autofocus=""
          error={errors.reason?.message}
        />
        <TextareaField
          {...register('description')}
          label={LABELS.description}
          maxLength={2000}
          rows={5}
          hint="Ceritakan apa yang terjadi, kapan, dan apa yang kamu harapkan."
          error={errors.description?.message}
        />
        <UrlListFields
          legend="Bukti (opsional)"
          hint="Tautan foto atau dokumen yang diawali https://. Maksimal 8."
          rows={evidence.fields}
          inputProps={(index) => register(`evidence.${index}.url`)}
          error={(index) => errors.evidence?.[index]?.url?.message}
          listError={errors.evidence?.message ?? errors.evidence?.root?.message}
          onAdd={() => evidence.append({ url: '' })}
          onRemove={evidence.remove}
        />
        <div className="flex flex-wrap justify-end gap-2">
          <CancelButton disabled={send.isPending} />
          <Button type="submit" loading={send.isPending}>
            Kirim sengketa
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
