import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { StatusBadge } from '../../../components/order/StatusBadge';
import { buttonClass } from '../../../components/ui/buttonClass';
import { ESCROW_NOTICE } from '../../../lib/constants';
import { cssVars } from '../../../lib/cssVars';
import { STAGES } from '../story';

const LINES = ['Cari di dekat rumah,', 'uangnya ditahan dulu'];

const chapters = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>('[data-chapter]')];

/** Posisi cerita: indeks bab yang sedang melewati tepi atas layar, ditambah seberapa jauh. */
function storyPosition(items: HTMLElement[]) {
  let position = 0;
  items.forEach((item, index) => {
    const { top, height } = item.getBoundingClientRect();
    if (top < 0) position = index + Math.min(1, -top / height);
  });
  return Math.min(items.length - 1, position);
}

/** Pembuka dan cerita Rekber di atas satu scene 3D yang diam di layar. */
export function RiverStory() {
  const root = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const section = root.current;
    const target = host.current;
    if (!section || !target) return;
    const items = chapters(section);
    const onScroll = () => setStage(Math.round(storyPosition(items)));
    window.addEventListener('scroll', onScroll, { passive: true });

    let active = true;
    let stop: (() => void) | undefined;
    // three.js diunduh terpisah. Tanpa WebGL, latar CSS tetap tampil dan cerita tetap terbaca.
    void import('../scene')
      .then(({ createRiverScene }) => {
        if (!active) return;
        stop = createRiverScene(target, {
          still: !window.matchMedia('(prefers-reduced-motion: no-preference)').matches,
          read: () => storyPosition(items),
        });
      })
      .catch(() => undefined);

    return () => {
      active = false;
      window.removeEventListener('scroll', onScroll);
      stop?.();
    };
  }, []);

  const goTo = (index: number) => {
    const item = root.current && chapters(root.current)[index];
    if (!item) return;
    const smooth = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
    window.scrollTo({
      top: window.scrollY + item.getBoundingClientRect().top + 1,
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  // Nomor urut kata lintas baris, untuk jeda masuk.
  const offsets = LINES.map((_, line) => LINES.slice(0, line).join(' ').split(' ').filter(Boolean).length);
  const words = LINES.join(' ').split(' ').length;

  return (
    <section ref={root} aria-labelledby="judul-utama" className="river section-contrast">
      <div className="river-sticky">
        <div ref={host} aria-hidden="true" className="river-canvas" />
        <div aria-hidden="true" className="river-scrim" />
        <ul aria-label="Pilih tahap" className="river-steps" data-show={stage > 0 || undefined}>
          {STAGES.map((item, index) => (
            <li key={item.status}>
              <button
                type="button"
                aria-label={`Lihat tahap ${index + 1}: ${item.title}`}
                aria-current={stage === index + 1 ? 'step' : undefined}
                onClick={() => goTo(index + 1)}
                className="river-step"
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="river-chapters">
        <div data-chapter className="river-chapter river-hero">
          <div className="river-text gap-5">
            <h1 id="judul-utama" className="text-display">
              {LINES.map((line, row) => (
                <span key={line} className="block">
                  {line.split(' ').map((word, index) => (
                    <span key={index}>
                      <span className="hero-word" style={cssVars({ '--i': (offsets[row] ?? 0) + index })}>
                        {word}
                      </span>{' '}
                    </span>
                  ))}
                </span>
              ))}
            </h1>
            <p className="enter max-w-[40ch] text-base text-muted md:text-h3 md:font-normal" style={cssVars({ '--enter-index': words })}>
              Cari barang, sewa, jasa, dan bantuan di Palembang. Dana baru diteruskan setelah kamu konfirmasi.
            </p>
            <div className="enter flex flex-wrap gap-3" style={cssVars({ '--enter-index': words + 1 })}>
              <Link to="/jelajah" className={buttonClass('primary', 'min-h-13 px-8')}>
                Jelajahi
              </Link>
              <Link to="/jual" className={buttonClass('secondary', 'min-h-13 px-8')}>
                Pasang listing
              </Link>
            </div>
            <p className="enter text-sm text-muted" style={cssVars({ '--enter-index': words + 2 })}>
              {ESCROW_NOTICE}
            </p>
          </div>
        </div>

        <ol aria-label="Cara kerja Rekber">
          {STAGES.map((item, index) => (
            <li key={item.status} data-chapter className="river-chapter">
              <div className="river-text reveal gap-4">
                {index === 0 && <h2 className="text-h3 text-muted">Cara kerja Rekber</h2>}
                <h3 className="max-w-[14ch] font-display text-h1 [font-stretch:112%]">{item.title}</h3>
                <p className="max-w-[38ch] text-h3 font-normal text-muted">{item.body}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={item.status} />
                  <p className="text-sm tabular-nums">
                    Contoh: Rp150.000, <strong>{item.money}</strong>
                  </p>
                </div>
                {index === STAGES.length - 1 && <p className="text-sm text-muted">{ESCROW_NOTICE}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
