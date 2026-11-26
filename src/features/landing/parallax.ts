import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const QUERIES = {
  motion: '(prefers-reduced-motion: no-preference)',
  wide: '(min-width: 768px)',
  narrow: '(max-width: 767.98px)',
};

/**
 * MO-25: tiap `[data-depth]` bergeser mengikuti scroll di dalam `[data-scene]`-nya.
 * Depth positif terasa dekat (naik lebih cepat), negatif terasa jauh (tertinggal).
 */
/** Memberi browser kesempatan menggambar, karena pemuatan ini terjadi saat pengguna sedang menggulir. */
const pause = () => new Promise<void>((resolve) => window.setTimeout(resolve));

/** Satu trigger per adegan, bukan per lapisan, agar ringan saat dibuat dan dihitung ulang. */
function moveScene(scene: HTMLElement, scale: number) {
  const layers = [...scene.querySelectorAll<HTMLElement | SVGElement>('[data-depth]')];
  const distance = (index: number) => Number(layers[index]?.dataset.depth) * scale;
  // Section teratas sudah terlihat saat dimuat, jadi mulai dari posisi aslinya.
  const top = scene.dataset.scene === 'top';

  gsap.fromTo(
    layers,
    { y: (index: number) => (top ? 0 : distance(index)) },
    {
      y: (index: number) => -distance(index),
      ease: 'none',
      scrollTrigger: {
        trigger: scene,
        start: top ? 'top top' : 'top bottom',
        end: 'bottom top',
        scrub: true,
        // Dihitung setelah pin cerita Rekber, yang menambah tinggi halaman.
        refreshPriority: -1,
      },
    },
  );
}

export function startParallax(root: HTMLElement) {
  let active = true;
  let media: gsap.MatchMedia | undefined;

  // Pendaftaran plugin dan tiap adegan dikerjakan dalam tugas terpisah.
  const build = async () => {
    await pause();
    if (!active) return;
    gsap.registerPlugin(ScrollTrigger);
    media = gsap.matchMedia(root);
    for (const scene of root.querySelectorAll<HTMLElement>('[data-scene]')) {
      await pause();
      if (!active) return;
      media.add(QUERIES, (context) => {
        // Di layar sempit jaraknya separuh.
        if (context.conditions?.motion) moveScene(scene, context.conditions.wide ? 1 : 0.5);
      });
    }
  };
  void build();

  // Data, font, atau pin yang datang belakangan mengubah tinggi halaman.
  let timer = 0;
  let height = root.offsetHeight;
  const resize = new ResizeObserver(() => {
    if (root.offsetHeight === height) return;
    height = root.offsetHeight;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => ScrollTrigger.refresh(true), 200);
  });
  resize.observe(root);

  return () => {
    active = false;
    resize.disconnect();
    window.clearTimeout(timer);
    media?.revert();
  };
}
