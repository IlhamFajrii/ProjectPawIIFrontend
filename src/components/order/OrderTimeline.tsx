import { useState } from 'react';
import type { OrderHistoryEntry } from '../../lib/api/types';
import { ORDER_STATUS_LABEL } from '../../lib/constants';
import { formatDateTime } from '../../lib/format';
import { STATUS_STYLE } from './statusStyle';

interface Props {
  history: OrderHistoryEntry[];
  buyerId: string;
  sellerId: string;
  /** Contoh di landing tidak menampilkan waktu. */
  hideTime?: boolean;
}

export function OrderTimeline({ history, buyerId, sellerId, hideTime }: Props) {
  // Hanya tahap yang muncul setelah tampil pertama yang dianimasikan (MO-09).
  const [initialCount] = useState(history.length);
  const actor = (id: string) => (id === buyerId ? 'Pembeli' : id === sellerId ? 'Penjual' : 'Admin');

  return (
    <ol className="grid">
      {history.map((entry, index) => {
        const { icon: Icon, tone } = STATUS_STYLE[entry.status];
        const last = index === history.length - 1;
        return (
          <li
            key={`${entry.status}-${index}`}
            className={`flex gap-3 ${index >= initialCount ? 'timeline-new' : ''}`}
            aria-current={last ? 'step' : undefined}
          >
            <div className="flex flex-col items-center">
              <span className={`grid size-9 shrink-0 place-items-center rounded-full border border-line bg-bg ${tone}`}>
                <Icon className="size-4" aria-hidden="true" />
              </span>
              {!last && <span aria-hidden="true" className="w-px flex-1 bg-line" />}
            </div>
            <div className={last ? 'pb-0' : 'pb-4'}>
              <p className={`pt-1.5 text-sm ${last ? 'font-semibold' : 'font-medium'}`}>
                {ORDER_STATUS_LABEL[entry.status]}
              </p>
              <p className="text-sm text-muted">
                {actor(entry.by)}
                {!hideTime && (
                  <>
                    {' · '}
                    <time dateTime={entry.at}>{formatDateTime(entry.at)}</time>
                  </>
                )}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
