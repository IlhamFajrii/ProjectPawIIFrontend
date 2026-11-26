import { useState, type CSSProperties } from 'react';
import type { ListingType } from '../../lib/api/types';
import { LISTING_TYPE_LABEL } from '../../lib/constants';
import { safeUrl } from '../../lib/url';
import { TYPE_ICON } from './typeIcon';

interface Props {
  src?: string;
  alt: string;
  type: ListingType;
  category?: string;
  priority?: boolean;
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Rasio tetap 4:3. Fallback selalu ada di belakang foto, sehingga foto kosong,
 * rusak, atau lambat tidak menggeser layout.
 */
export function ListingImage({ src, alt, type, category, priority, compact, className = '', style }: Props) {
  const url = safeUrl(src);
  const [failed, setFailed] = useState<string>();
  const showImage = url !== undefined && failed !== url;
  const Icon = TYPE_ICON[type];

  return (
    <div
      className={`relative aspect-4/3 w-full overflow-hidden rounded-card bg-surface ${className}`}
      style={style}
      {...(showImage ? {} : { role: 'img', 'aria-label': `${alt}. Tanpa foto.` })}
    >
      <div aria-hidden="true" className="zoom-target absolute inset-0 grid place-content-center justify-items-center gap-2 p-3">
        {compact ? (
          <Icon className="size-6 text-muted" strokeWidth={1.5} />
        ) : (
          <>
            <span className="font-display text-h1 text-muted">{LISTING_TYPE_LABEL[type]}</span>
            {category && <span className="line-clamp-2 text-center text-sm text-muted capitalize">{category}</span>}
          </>
        )}
      </div>
      {showImage && (
        <img
          src={url}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          referrerPolicy="no-referrer"
          onError={() => setFailed(url)}
          className="zoom-target absolute inset-0 size-full object-cover"
        />
      )}
    </div>
  );
}
