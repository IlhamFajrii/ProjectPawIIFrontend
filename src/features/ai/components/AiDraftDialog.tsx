import { useMutation } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { useRequestClose } from '../../../components/ui/dialogContext';
import { TextareaField } from '../../../components/ui/Field';
import { draftListing } from '../../../lib/api/ai';
import { ApiError } from '../../../lib/api/client';
import type { AiDraft } from '../../../lib/api/types';
import { prepareImage } from '../image';

type Values = AiDraft;

interface Props {
  open: boolean;
  onClose: () => void;
  current: Values;
  onApply: (values: Partial<Values>) => void;
}

const NAMES = ['title', 'description', 'category'] as const;
const LABELS = { title: 'Judul', description: 'Deskripsi', category: 'Kategori' };

function describe(error: Error) {
  const manual = 'Kamu tetap bisa mengisi form secara manual.';
  if (error instanceof ApiError && error.status === 413) return `Ukuran foto terlalu besar. ${manual}`;
  return `${error.message} ${manual}`;
}

function CloseButton({ disabled }: { disabled: boolean }) {
  const requestClose = useRequestClose();
  return (
    <Button variant="secondary" onClick={requestClose} disabled={disabled}>
      Tutup
    </Button>
  );
}

/** PU-11. */
export function AiDraftDialog({ open, onClose, current, onApply }: Props) {
  const fileId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [missing, setMissing] = useState(false);

  const draft = useMutation({
    mutationFn: async (photo: File) => {
      const image = await prepareImage(photo);
      return draftListing({
        imageBase64: image.imageBase64,
        mimeType: image.mimeType,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
    },
  });

  const close = () => {
    setFile(null);
    setNote('');
    setMissing(false);
    draft.reset();
    onClose();
  };

  const filled = NAMES.filter((name) => current[name].trim() !== '');
  const use = (names: readonly (keyof Values)[]) => {
    if (!draft.data) return;
    onApply(Object.fromEntries(names.map((name) => [name, draft.data[name]])));
    close();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Isi dengan bantuan AI"
      dirty={file !== null || note !== ''}
      busy={draft.isPending}
    >
      {draft.data ? (
        <div className="grid gap-4">
          <p className="text-muted" role="status">
            Draft siap. Periksa dulu sebelum dipakai. Harga tetap kamu isi sendiri.
          </p>
          <dl className="grid gap-3 rounded-card bg-surface p-4">
            {NAMES.map((name) => (
              <div key={name}>
                <dt className="text-sm text-muted">{LABELS[name]}</dt>
                <dd className="break-words whitespace-pre-line">{draft.data[name]}</dd>
              </div>
            ))}
          </dl>
          {filled.length > 0 && (
            <p className="font-medium text-warning">
              Isian {filled.map((name) => LABELS[name].toLowerCase()).join(', ')} yang sudah ada akan diganti bila kamu
              memilih Ganti dengan draft.
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="text" onClick={() => draft.reset()}>
              Ulangi
            </Button>
            {filled.length > 0 && filled.length < NAMES.length && (
              <Button variant="secondary" onClick={() => use(NAMES.filter((name) => !filled.includes(name)))}>
                Isi yang kosong saja
              </Button>
            )}
            <Button onClick={() => use(NAMES)} autoFocus>
              {filled.length > 0 ? 'Ganti dengan draft' : 'Pakai draft'}
            </Button>
          </div>
        </div>
      ) : (
        <form
          noValidate
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!file) return setMissing(true);
            draft.mutate(file);
          }}
        >
          <p className="text-muted">
            AI membuat judul, deskripsi, dan kategori dari satu foto. Foto ini <strong>tidak tersimpan</strong> sebagai
            foto listing. Foto listing tetap diisi lewat URL.
          </p>
          <div className="grid gap-1.5">
            <label htmlFor={fileId} className="text-sm font-medium">
              Foto (JPEG, PNG, atau WebP)
            </label>
            <input
              id={fileId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              data-autofocus=""
              aria-invalid={missing && !file ? true : undefined}
              aria-describedby={`${fileId}-hint`}
              className="min-h-11 w-full min-w-0 rounded-input border border-control p-2 file:mr-3 file:min-h-8 file:rounded-full file:border-0 file:bg-surface file:px-4 file:text-ink"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                draft.reset();
              }}
            />
            <p id={`${fileId}-hint`} className="text-sm text-muted">
              {file ? `Dipilih: ${file.name}. ` : ''}Foto di atas 3 MB diperkecil dulu di perangkatmu.
            </p>
            {missing && !file && (
              <p role="alert" className="text-sm font-medium text-danger">
                Pilih foto dulu.
              </p>
            )}
          </div>
          <TextareaField
            label="Catatan untuk AI (opsional)"
            value={note}
            maxLength={500}
            rows={3}
            onChange={(event) => setNote(event.target.value)}
          />
          {draft.error && (
            <p role="alert" className="font-medium text-danger">
              {describe(draft.error)}
            </p>
          )}
          {draft.isPending && (
            <p role="status" className="text-muted">
              Membuat draft. Ini bisa memakan waktu sampai 30 detik.
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <CloseButton disabled={draft.isPending} />
            <Button type="submit" loading={draft.isPending}>
              Buat draft
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
