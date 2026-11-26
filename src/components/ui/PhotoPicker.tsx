import { ImagePlus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ListingType } from '../../lib/api/types';
import { MAX_URLS } from '../../lib/schemas';
import { useCurrentUser } from '../../lib/session';
import { uploadPhoto, type PhotoKind } from '../../lib/uploadPhoto';
import { ListingImage } from '../listing/ListingImage';
import { Button } from './Button';
import { iconButtonClass } from './buttonClass';

interface Props {
  legend: string;
  hint: string;
  /** Folder tujuan di Vercel Blob. */
  kind?: PhotoKind;
  urls: string[];
  type: ListingType;
  error?: string;
  onAdd: (url: string) => void;
  onRemove: (index: number) => void;
  onBusyChange: (busy: boolean) => void;
}

/** Memilih foto dari galeri atau kamera, mengunggahnya, dan menampilkan pratinjau. */
export function PhotoPicker({ legend, hint, kind, urls, type, error: listError, onAdd, onRemove, onBusyChange }: Props) {
  const user = useCurrentUser();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string>();
  const [error, setError] = useState<string>();
  const room = MAX_URLS - urls.length;

  const pick = async (files: File[]) => {
    const chosen = files.slice(0, room);
    if (!chosen.length) return;
    setError(files.length > room ? `Maksimal ${MAX_URLS} foto, jadi hanya ${room} yang diunggah.` : undefined);
    onBusyChange(true);
    try {
      for (const [index, file] of chosen.entries()) {
        setProgress(`Mengunggah foto ${index + 1} dari ${chosen.length}…`);
        onAdd(await uploadPhoto(file, user._id, kind));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Foto gagal diunggah. Coba lagi.');
    } finally {
      setProgress(undefined);
      onBusyChange(false);
    }
  };

  return (
    <fieldset className="grid min-w-0 gap-3">
      <legend className="text-sm font-medium">{legend}</legend>
      <p className="text-sm text-muted">{hint}</p>

      {urls.some(Boolean) && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {urls.map((url, index) =>
            url ? (
              <li key={`${index}-${url}`} className="relative">
                <ListingImage src={url} alt={`Foto ${index + 1}`} type={type} compact />
                <button
                  type="button"
                  className={`${iconButtonClass} absolute top-1 right-1 bg-bg`}
                  onClick={() => onRemove(index)}
                  disabled={Boolean(progress)}
                  aria-label={`Hapus foto ${index + 1}`}
                >
                  <Trash2 className="size-5" aria-hidden="true" />
                </button>
              </li>
            ) : null,
          )}
        </ul>
      )}

      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          // Dikosongkan agar foto yang sama bisa dipilih lagi.
          event.target.value = '';
          void pick(files);
        }}
      />
      <Button
        variant="secondary"
        className="justify-self-start"
        loading={Boolean(progress)}
        disabled={room <= 0}
        onClick={() => input.current?.click()}
      >
        <ImagePlus className="size-5" aria-hidden="true" />
        Pilih foto ({urls.length}/{MAX_URLS})
      </Button>
      <p role="status" className="text-sm text-muted empty:hidden">
        {progress}
      </p>
      {(error ?? listError) && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error ?? listError}
        </p>
      )}
    </fieldset>
  );
}
