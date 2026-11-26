import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

/** `null` berarti judul diatur komponen lain. */
export function useTitle(title?: string | null) {
  useEffect(() => {
    if (title === null) return;
    document.title = title ? `${title} · PUNYA` : 'PUNYA · Marketplace lokal Palembang';
  }, [title]);
}

export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}

export function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
