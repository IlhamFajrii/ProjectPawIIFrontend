import type { ThemePreference } from '../../lib/theme';

export const THEME_OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Sistem' },
  { value: 'light', label: 'Terang' },
  { value: 'dark', label: 'Gelap' },
];
