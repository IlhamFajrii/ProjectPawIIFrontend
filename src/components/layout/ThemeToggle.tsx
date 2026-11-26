import { Monitor, Moon, Sun } from 'lucide-react';
import { setThemeWithReveal, useThemePreference, type ThemePreference } from '../../lib/theme';
import { iconButtonClass } from '../ui/buttonClass';
import { Menu } from '../ui/Menu';
import { menuItemClass } from './menuItemClass';
import { THEME_OPTIONS } from './themeOptions';

const ICON: Record<ThemePreference, typeof Sun> = { system: Monitor, light: Sun, dark: Moon };

export function ThemeToggle() {
  const preference = useThemePreference();
  const Current = ICON[preference];

  return (
    <Menu label="Pilih tema" triggerClass={iconButtonClass} trigger={<Current className="size-5" aria-hidden="true" />}>
      {THEME_OPTIONS.map(({ value, label }) => {
        const Icon = ICON[value];
        return (
          <button
            key={value}
            type="button"
            className={menuItemClass}
            aria-pressed={preference === value}
            onClick={() => setThemeWithReveal(value, document.querySelector('[aria-label="Pilih tema"]'))}
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </Menu>
  );
}
