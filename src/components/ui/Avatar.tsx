import { useState } from 'react';
import { safeUrl } from '../../lib/url';

const SIZES = { sm: 'size-10 text-sm', lg: 'size-20 text-h3' };

export function Avatar({ name, src, size = 'sm' }: { name: string; src?: string; size?: keyof typeof SIZES }) {
  const url = safeUrl(src);
  const [failed, setFailed] = useState<string>();
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface font-semibold text-muted ${SIZES[size]}`}
    >
      <span aria-hidden="true">{initial}</span>
      {url && failed !== url && (
        // Dekoratif: nama selalu ditulis di sampingnya.
        <img
          src={url}
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setFailed(url)}
          className="absolute inset-0 size-full bg-surface object-cover"
        />
      )}
    </span>
  );
}
