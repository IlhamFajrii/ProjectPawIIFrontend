import { RotateCcw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../../../components/ui/Button';
import { buttonClass } from '../../../components/ui/buttonClass';
import { useMediaQuery } from '../../../lib/hooks';
import { ExampleLabel } from './ExampleLabel';
import { cssVars } from '../../../lib/cssVars';

const FIELDS = [
  { label: 'Judul', value: 'Kipas angin berdiri' },
  { label: 'Deskripsi', value: 'Kipas berdiri warna putih. Periksa kondisinya saat bertemu.' },
  { label: 'Kategori', value: 'elektronik' },
];

/** Peragaan foto menjadi draft: sekali jalan sekitar tiga detik, bisa diputar ulang (MO-18). */
function Demo() {
  let order = 0;
  return (
    <div className="relative overflow-hidden rounded-tile bg-surface p-6 text-left sm:p-8">
      <span aria-hidden="true" className="demo-scan" />
      <dl className="grid content-start gap-3">
        {FIELDS.map((field) => (
          <div key={field.label}>
            <dt className="text-sm text-muted">{field.label}</dt>
            <dd className="font-medium">
              {field.value.split(' ').map((word, index) => (
                <span key={index}>
                  <span className="demo-word" style={cssVars({ '--i': order++ })}>
                    {word}
                  </span>{' '}
                </span>
              ))}
            </dd>
          </div>
        ))}
        <div className="demo-price border-t border-dashed border-control pt-3">
          <dt className="text-sm text-muted">Harga</dt>
          <dd className="font-semibold">Kamu yang isi</dd>
        </div>
      </dl>
    </div>
  );
}

export function AiSection() {
  const motion = useMediaQuery('(prefers-reduced-motion: no-preference)');
  const [playing, setPlaying] = useState(false);
  const [run, setRun] = useState(0);

  // Mulai saat peragaan masuk layar. Tanpa JavaScript atau gerak, isinya tampil utuh.
  const watch = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setPlaying(true);
        observer.disconnect();
      },
      { threshold: 0.15 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section aria-labelledby="ai" className="relative overflow-clip py-section">
      <div className="relative mx-auto grid w-full max-w-3xl justify-items-center gap-6 px-4 text-center md:px-6">
        <h2 id="ai" className="reveal max-w-[18ch] text-h1">
          AI menyusun draft dari fotomu, harganya kamu yang tentukan
        </h2>
        <p className="max-w-prose text-muted">
          Pilih satu foto, lalu AI menyarankan judul, deskripsi, dan kategori. Periksa dulu sebelum dipakai. Foto itu
          tidak disimpan sebagai foto listing.
        </p>
        <div ref={watch} className="grid w-full gap-2">
          <div className="justify-self-start">
            <ExampleLabel />
          </div>
          <div key={run} data-play={playing ? '' : undefined}>
            <Demo />
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {motion && (
            <Button variant="text" onClick={() => setRun((value) => value + 1)}>
              <RotateCcw className="size-5" aria-hidden="true" />
              Putar ulang
            </Button>
          )}
          <Link to="/jual" className={buttonClass('secondary')}>
            Coba saat memasang listing
          </Link>
        </div>
      </div>
    </section>
  );
}
