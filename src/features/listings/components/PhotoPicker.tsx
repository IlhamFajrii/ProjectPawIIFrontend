import { ImagePlus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { ListingImage } from '../../../components/listing/ListingImage';
import { Button } from '../../../components/ui/Button';
import { iconButtonClass } from '../../../components/ui/buttonClass';
import type { ListingType } from '../../../lib/api/types';
import { MAX_URLS } from '../../../lib/schemas';
import { useCurrentUser } from '../../../lib/session';
import { uploadPhoto } from '../../../lib/uploadPhoto';

interface Props {
  urls: string[];
  type: ListingType;
  onAdd: (url: string) => void;
  onRemove: (index: number) => void;
  onBusyChange: (busy: boolean) => void;
}

/** Memilih foto dari galeri atau kamera, mengunggahnya, dan menampilkan pratinjau. */
export function PhotoPicker({ urls, type, onAdd, onRemove, onBusyChange }: Props) {
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
        onAdd(await uploadPhoto(file, user._id));
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
      <legend className="text-sm font-medium">Foto (opsional)</legend>
      <p className="text-sm text-muted">
        Pakai fotomu sendiri, maksimal {MAX_URLS}. Foto pertama menjadi sampul. Foto bisa dilihat siapa saja.
      </p>

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
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
