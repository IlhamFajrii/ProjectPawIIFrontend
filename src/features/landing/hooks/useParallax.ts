import { useCallback } from 'react';

/**
 * Ref untuk akar beranda. GSAP baru diunduh saat parallax mulai terlihat gunanya
 * (halaman digulir, atau adegannya sudah tampak), dan tidak sama sekali bila gerak dikurangi.
 */
export function useParallax() {
  return useCallback((root: HTMLElement | null) => {
    if (!root) return;
    let active = true;
    let stop: (() => void) | undefined;

    const load = () => {
      if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
      window.removeEventListener('scroll', load);
      void import('../parallax').then(
        ({ startParallax }) => {
          if (active) stop = startParallax(root);
        },
        // Hiasan: bila potongannya gagal diunduh, halaman tetap utuh tanpa parallax.
        () => undefined,
      );
    };

    window.addEventListener('scroll', load, { passive: true });
    const visible = [...root.querySelectorAll('[data-scene=""]')].some(
      (scene) => scene.getBoundingClientRect().top < window.innerHeight,
    );
    if (window.scrollY > 0 || visible) load();

    return () => {
      active = false;
      window.removeEventListener('scroll', load);
      stop?.();
    };
  }, []);
}
