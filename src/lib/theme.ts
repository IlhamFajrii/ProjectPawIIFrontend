import { useSyncExternalStore } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_KEY = 'punya.theme';
// Harus sama dengan token --bg di styles/index.css dan skrip di index.html.
const THEME_COLOR = { light: '#ffffff', dark: '#05070d' };
const DARK_QUERY = '(prefers-color-scheme: dark)';

let current: ThemePreference | null = null;
const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

const preference = () => (current ??= readPreference());

export function applyTheme() {
  const choice = preference();
  const dark = choice === 'dark' || (choice === 'system' && window.matchMedia(DARK_QUERY).matches);
  const theme = dark ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
}

export function setTheme(next: ThemePreference) {
  current = next;
  try {
    if (next === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, next);
  } catch {
    // Storage diblokir: pilihan berlaku selama halaman terbuka.
  }
  applyTheme();
  listeners.forEach((listener) => listener());
}

/** Ganti tema dengan lingkaran yang melebar dari elemen pemicu. Tanpa dukungan: langsung berganti. */
export function setThemeWithReveal(next: ThemePreference, origin?: Element | null) {
  const motion = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
  if (!motion || !('startViewTransition' in document)) return setTheme(next);

  const root = document.documentElement;
  const box = origin?.getBoundingClientRect();
  root.style.setProperty('--reveal-x', `${box ? box.left + box.width / 2 : window.innerWidth / 2}px`);
  root.style.setProperty('--reveal-y', `${box ? box.top + box.height / 2 : 0}px`);
  root.dataset.reveal = '';
  const done = () => delete root.dataset.reveal;
  document.startViewTransition(() => setTheme(next)).finished.then(done, done);
}

/** Mengikuti perubahan tema OS dan pilihan di tab lain. Dipanggil sekali saat aplikasi mulai. */
export function watchTheme() {
  const media = window.matchMedia(DARK_QUERY);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_KEY) return;
    current = readPreference();
    applyTheme();
    listeners.forEach((listener) => listener());
  };
  media.addEventListener('change', applyTheme);
  window.addEventListener('storage', onStorage);
  applyTheme();
  return () => {
    media.removeEventListener('change', applyTheme);
    window.removeEventListener('storage', onStorage);
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const useThemePreference = () => useSyncExternalStore(subscribe, preference);
