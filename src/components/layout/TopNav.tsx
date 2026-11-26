import { LogOut, UserRound } from 'lucide-react';
import { Link, NavLink } from 'react-router';
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
  'pressable relative isolate inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-muted hover:text-ink aria-[current=page]:text-ink';

function MainLink({ to, children }: { to: string; children: string }) {
  return (
    <NavLink to={to} viewTransition={supportsViewTransition()} className={navClass}>
      <span aria-hidden="true" className="nav-pill" />
      {children}
    </NavLink>
  );
}

export function TopNav() {
  const { status, user, openAuth, retry } = useSession();
  const signOut = useSignOut();

  return (
    <header className="site-header sticky top-0 z-40 h-nav">
      <div aria-hidden="true" className="nav-glass absolute inset-0" />
      <div aria-hidden="true" className="nav-solid absolute inset-0" />
      <div className="relative mx-auto flex h-full max-w-page items-center gap-2 px-4 md:px-6 lg:px-8">
        <Link to="/" viewTransition={supportsViewTransition()} className="inline-flex min-h-11 items-center text-h3 font-bold">
          PUNYA
        </Link>
        <nav aria-label="Utama" className="ml-4 hidden gap-1 md:flex">
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
        <div className="ml-auto flex items-center gap-1">
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
