import { CirclePlus, House, MessageCircle, Search, UserRound, type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router';
import { useSession } from '../../lib/session';
import { supportsViewTransition } from '../../lib/viewTransition';

export function TabBar() {
  const { status } = useSession();
  const items: { to: string; label: string; icon: LucideIcon }[] = [
    { to: '/', label: 'Beranda', icon: House },
    { to: '/jelajah', label: 'Jelajah', icon: Search },
    { to: '/jual', label: 'Jual', icon: CirclePlus },
    { to: '/pesan', label: 'Pesan', icon: MessageCircle },
    status === 'guest'
      ? { to: '/masuk', label: 'Masuk', icon: UserRound }
      : { to: '/profil', label: 'Akun', icon: UserRound },
  ];

  return (
    <nav
      aria-label="Tab"
      className="tab-bar bar-glass fixed inset-x-0 bottom-0 z-40 border-t border-line pb-[env(safe-area-inset-bottom,0px)] md:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              viewTransition={supportsViewTransition()}
              className="pressable flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted aria-[current=page]:font-semibold aria-[current=page]:text-accent"
            >
              <span className="relative isolate grid h-8 w-14 place-items-center">
                <span aria-hidden="true" className="tab-pill" />
                <Icon className="tab-icon size-6" aria-hidden="true" />
              </span>
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
