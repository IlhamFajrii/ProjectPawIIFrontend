import { LoaderCircle, LogOut, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigation } from 'react-router';
import { useSession } from '../../lib/session';
import { useSignOut } from '../../lib/useSignOut';
import { supportsViewTransition } from '../../lib/viewTransition';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { iconButtonClass } from '../ui/buttonClass';
import { Menu } from '../ui/Menu';
import { accountLinks } from './accountLinks';
import { menuItemClass } from './menuItemClass';
import { ThemeToggle } from './ThemeToggle';

const navClass =
  'pressable relative isolate inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-muted hover:text-ink focus-visible:-outline-offset-2 aria-[current=page]:text-ink';

function MainLink({ to, children }: { to: string; children: string }) {
  return (
    <div className="island-item">
      <span className="island-clip">
        <NavLink to={to} viewTransition={supportsViewTransition()} className={navClass}>
          <span aria-hidden="true" className="nav-pill" />
          {children}
        </NavLink>
      </span>
    </div>
  );
}

function useScrolled(offset: number) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > offset);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [offset]);
  return scrolled;
}

export function TopNav() {
  const { status, user, openAuth, retry } = useSession();
  const signOut = useSignOut();
  const loading = useNavigation().state === 'loading';
  const scrolled = useScrolled(80);
  // Dibuka dari sisi logo dan menu saja, agar tombol di kanan tidak lari saat didekati.
  const [hovered, setHovered] = useState(false);

  return (
    <header className="site-header pointer-events-none sticky top-0 z-40 flex h-nav items-start justify-center px-2 pt-2">
      <div
        className="island pointer-events-auto flex max-w-full items-center rounded-full p-1"
        data-compact={(scrolled && !hovered) || undefined}
        onPointerLeave={() => setHovered(false)}
      >
        <div className="flex items-center" onPointerEnter={() => setHovered(true)}>
          <Link
            to="/"
            viewTransition={supportsViewTransition()}
            className="inline-flex min-h-11 items-center rounded-full px-3 text-h3 font-bold focus-visible:-outline-offset-2 sm:px-4"
          >
            PUNYA
          </Link>
          <nav aria-label="Utama" className="hidden md:flex">
            <MainLink to="/jelajah">Jelajah</MainLink>
            <MainLink to="/jual">Jual</MainLink>
            {status === 'authed' && (
              <>
                <MainLink to="/pesanan">Pesanan</MainLink>
                <MainLink to="/pesan">Pesan</MainLink>
                <MainLink to="/circle">Circle</MainLink>
              </>
            )}
          </nav>
        </div>
        <div role="status" className="island-activity" data-active={loading || undefined}>
          <span className="island-clip">
            {loading && (
              <span className="flex min-h-11 items-center gap-2 px-3 text-sm text-muted">
                <LoaderCircle className="spin size-4 text-accent" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Memuat…</span>
              </span>
            )}
          </span>
        </div>
        <div className="ml-2 flex items-center gap-1 sm:ml-4">
          <ThemeToggle />
          {status === 'guest' && (
            <Button variant="primary" className="text-sm" onClick={() => openAuth('login')}>
              Masuk
            </Button>
          )}
          {status === 'error' && (
            <>
              <Button variant="text" className="text-sm" onClick={retry}>
                Muat sesi
              </Button>
              <Button variant="secondary" className="text-sm" onClick={() => void signOut()}>
                Keluar
              </Button>
            </>
          )}
          {user && (
            <div className="hidden md:block">
              <Menu
                label={`Menu akun ${user.name}`}
                triggerClass={iconButtonClass}
                trigger={<Avatar name={user.name} src={user.avatarUrl} />}
              >
                <p className="truncate px-3 py-2 text-sm text-muted">{user.name}</p>
                <Link to="/profil" className={menuItemClass}>
                  <UserRound className="size-5" aria-hidden="true" />
                  Profil
                </Link>
                {accountLinks(user).map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to} className={menuItemClass}>
                    <Icon className="size-5" aria-hidden="true" />
                    {label}
                  </Link>
                ))}
                <button type="button" className={menuItemClass} onClick={() => void signOut()}>
                  <LogOut className="size-5" aria-hidden="true" />
                  Keluar
                </button>
              </Menu>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
