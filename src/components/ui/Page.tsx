import type { ReactNode } from 'react';
import { useTitle } from '../../lib/hooks';

const WIDTHS = { page: 'max-w-page', narrow: 'max-w-2xl' };

interface Props {
  title: string;
  /** Judul tab bila berbeda dari judul halaman. */
  documentTitle?: string;
  actions?: ReactNode;
  intro?: ReactNode;
  width?: keyof typeof WIDTHS;
  children: ReactNode;
}

export function Page({ title, documentTitle, actions, intro, width = 'page', children }: Props) {
  useTitle(documentTitle ?? title);
  return (
    <div className={`mx-auto grid w-full grid-cols-1 content-start gap-6 px-4 py-8 md:px-6 lg:px-8 lg:py-12 ${WIDTHS[width]}`}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid min-w-0 gap-2">
          <h1 className="text-h1">{title}</h1>
          {intro && <p className="max-w-prose text-muted">{intro}</p>}
        </div>
        {actions}
      </header>
      {children}
    </div>
  );
}
