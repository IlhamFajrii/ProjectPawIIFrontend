import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { useState } from 'react';
import { ListingImage } from '../../../components/listing/ListingImage';
import { iconButtonClass } from '../../../components/ui/buttonClass';
import { Dialog } from '../../../components/ui/Dialog';
import type { Listing } from '../../../lib/api/types';
import { safeUrl } from '../../../lib/url';

/** Galeri sampai 8 foto dan tampilan layar penuh (PU-04). */
export function Gallery({ listing }: { listing: Listing }) {
  const images = listing.images.filter((url) => safeUrl(url));
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState<string[]>([]);
  const index = Math.min(selected, Math.max(images.length - 1, 0));
  const current = images[index];
  const step = (delta: number) => setSelected((index + delta + images.length) % images.length);

  return (
    <div className="grid min-w-0 content-start gap-3">
      <div className="relative">
        <ListingImage
          key={current}
          src={current}
          alt={listing.title}
          type={listing.type}
          category={listing.category}
          priority
          style={{ viewTransitionName: 'listing-photo' }}
        />
        {current && (
          <button
            type="button"
            className={`${iconButtonClass} absolute right-2 bottom-2 border border-line bg-bg`}
            aria-label="Lihat foto layar penuh"
            onClick={() => setOpen(true)}
          >
            <Expand className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto p-1">
          {images.map((url, position) => (
            <li key={`${url}-${position}`} className="w-20 shrink-0">
              <button
                type="button"
                aria-label={`Tampilkan foto ${position + 1}`}
                aria-pressed={position === index}
                onClick={() => setSelected(position)}
                className="pressable block w-full rounded-card aria-pressed:outline-2 aria-pressed:outline-accent"
              >
                <ListingImage src={url} alt="" type={listing.type} compact />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open && current !== undefined} onClose={() => setOpen(false)} title="Foto" size="full" lightDismiss>
        {current && (
          <div
            className="grid h-full grid-rows-[minmax(0,1fr)_auto] gap-3"
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') step(-1);
              if (event.key === 'ArrowRight') step(1);
            }}
          >
            {broken.includes(current) ? (
              <p className="self-center text-center text-muted">Foto ini gagal dimuat.</p>
            ) : (
              <img
                src={current}
                alt={`${listing.title}, foto ${index + 1}`}
                referrerPolicy="no-referrer"
                onError={() => setBroken((list) => [...list, current])}
                className="size-full min-h-0 object-contain"
              />
            )}
            <div className="flex items-center justify-center gap-4">
              {images.length > 1 && (
                <button type="button" className={iconButtonClass} onClick={() => step(-1)} aria-label="Foto sebelumnya">
                  <ChevronLeft className="size-6" aria-hidden="true" />
                </button>
              )}
              <p className="text-sm text-muted tabular-nums" aria-live="polite">
                {index + 1} dari {images.length}
              </p>
              {images.length > 1 && (
                <button
                  type="button"
                  className={iconButtonClass}
                  onClick={() => step(1)}
                  aria-label="Foto berikutnya"
                  data-autofocus=""
                >
                  <ChevronRight className="size-6" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
