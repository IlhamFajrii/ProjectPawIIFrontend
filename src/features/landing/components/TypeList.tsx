import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import type { ListingType } from '../../../lib/api/types';
import { LISTING_TYPE_LABEL } from '../../../lib/constants';
import { supportsViewTransition } from '../../../lib/viewTransition';

const TYPES: { type: ListingType; body: string }[] = [
  { type: 'BARANG', body: 'Barang baru atau bekas dari orang di sekitarmu.' },
  { type: 'SEWA', body: 'Pakai sementara: tenda, kamera, alat kerja.' },
  { type: 'JASA', body: 'Servis, les, dan keahlian lain.' },
  { type: 'TUGAS', body: 'Minta bantuan untuk antar, angkat, atau urusan kecil.' },
];

/** Empat tipe sebagai baris huruf besar yang melebar saat digulir. */
export function TypeList() {
  return (
    <section data-scene="" aria-labelledby="tipe" className="overflow-x-clip py-section">
      <div className="mx-auto grid w-full max-w-page gap-10 px-4 md:px-6 lg:px-8">
        <div data-depth={30} className="grid gap-3">
          <h2 id="tipe" className="text-h1">
            Mau cari apa?
          </h2>
          <p className="max-w-prose text-muted">Barang, sewa, jasa, dan tugas dari orang di sekitarmu.</p>
        </div>
        <ul className="border-t border-line">
          {TYPES.map(({ type, body }) => (
            <li key={type} className="border-b border-line">
              <Link to={`/jelajah?type=${type}`} viewTransition={supportsViewTransition()} className="type-row">
                <span className="type-word">{LISTING_TYPE_LABEL[type]}</span>
                <span className="flex items-center justify-between gap-6 text-muted md:justify-end">
                  <span className="max-w-[28ch]">{body}</span>
                  <ArrowRight className="type-arrow size-7 shrink-0" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
