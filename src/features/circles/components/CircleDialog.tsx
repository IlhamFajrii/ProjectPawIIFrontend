import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { TextField } from '../../../components/ui/Field';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { createCircle, joinCircle } from '../../../lib/api/circles';
import { ApiError } from '../../../lib/api/client';
import { errorMessage } from '../../../lib/formErrors';
import { queryKeys } from '../../../lib/queryKeys';
import { useToast } from '../../../lib/toast';

export type CircleMode = 'create' | 'join';

const OPTIONS = [
  { value: 'create', label: 'Buat' },
  { value: 'join', label: 'Gabung' },
] as const;

const COPY = {
  create: { label: 'Nama circle', button: 'Buat circle', empty: 'Nama circle wajib diisi', success: 'Circle dibuat.' },
  join: { label: 'Kode undangan', button: 'Gabung circle', empty: 'Isi kode undangan', success: 'Kamu bergabung.' },
};

function describe(error: unknown) {
  if (error instanceof ApiError && error.status === 404) {
    return 'Kode undangan tidak ditemukan. Periksa lagi kodenya.';
  }
  if (error instanceof ApiError && error.status === 409) return 'Kamu sudah menjadi anggota circle itu.';
  if (error instanceof ApiError && error.errors[0]) return `${error.errors[0].message}`;
  return errorMessage(error);
}

interface Props {
  open: boolean;
  initialMode: CircleMode;
  onClose: () => void;
}

/** PU-12: buat atau gabung circle. */
export function CircleDialog({ open, initialMode, onClose }: Props) {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState(initialMode);
  const [values, setValues] = useState({ create: '', join: '' });
  const [invalid, setInvalid] = useState<string>();
  const [wasOpen, setWasOpen] = useState(open);
  const copy = COPY[mode];

  const submit = useMutation({
    mutationFn: ({ kind, value }: { kind: CircleMode; value: string }) =>
      kind === 'create' ? createCircle(value) : joinCircle(value),
    onSuccess: (circle, { kind }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.circles });
      toast.success(COPY[kind].success);
      onClose();
      void navigate(`/circle/${circle._id}`);
    },
  });

  // Setiap kali dibuka, mulai dari keadaan bersih.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setMode(initialMode);
      setValues({ create: '', join: '' });
      setInvalid(undefined);
      submit.reset();
    }
  }

  const error = invalid ?? (submit.error ? describe(submit.error) : undefined);

  return (
    <Dialog open={open} onClose={onClose} title="Circle" lightDismiss busy={submit.isPending}>
      <form
        noValidate
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const value = values[mode].trim();
          if (!value) return setInvalid(copy.empty);
          setInvalid(undefined);
          submit.mutate({ kind: mode, value });
        }}
      >
        <SegmentedControl
          legend="Buat atau gabung"
          value={mode}
          options={OPTIONS}
          onChange={(next) => {
            setMode(next);
            setInvalid(undefined);
            submit.reset();
          }}
        />
        <TextField
          key={mode}
          label={copy.label}
          value={values[mode]}
          maxLength={mode === 'create' ? 80 : 40}
          autoComplete="off"
          autoCapitalize={mode === 'join' ? 'characters' : 'sentences'}
          data-autofocus=""
          error={error}
          onChange={(event) => setValues((current) => ({ ...current, [mode]: event.target.value }))}
        />
        <Button type="submit" loading={submit.isPending}>
          {copy.button}
        </Button>
      </form>
    </Dialog>
  );
}
