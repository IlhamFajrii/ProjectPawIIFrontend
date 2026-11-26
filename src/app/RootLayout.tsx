import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, ScrollRestoration, useLocation, useNavigation } from 'react-router';
import { TabBar } from '../components/layout/TabBar';
import { TopNav } from '../components/layout/TopNav';
import { useSession } from '../lib/session';

const AuthDialog = lazy(() => import('../features/auth/components/AuthDialog'));

function AuthDialogHost() {
  const { authMode } = useSession();
  // Tetap terpasang setelah dibuka sekali, agar animasi keluar berjalan.
  const [used, setUsed] = useState(false);
  if (authMode && !used) setUsed(true);

  return used ? (
    <Suspense fallback={null}>
      <AuthDialog />
    </Suspense>
  ) : null;
}

export function RootLayout() {
  const { pathname } = useLocation();
  const loading = useNavigation().state === 'loading';
  const main = useRef<HTMLElement>(null);
  const previous = useRef(pathname);

  // Pindah halaman memindahkan fokus ke konten, agar pembaca layar tidak tertinggal.
  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    if (!document.querySelector('dialog:modal, dialog[open]')) main.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <>
      <a
        href="#konten"
        className="sr-only z-50 rounded-full bg-accent px-5 py-3 font-medium text-on-accent focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
          main.current?.scrollIntoView();
        }}
      >
        Lewati ke konten
      </a>
      <TopNav />
      {loading && (
        <p role="status" className="fixed top-nav right-4 z-40 rounded-full bg-surface px-3 py-1 text-sm">
          Memuat…
        </p>
      )}
      <main id="konten" ref={main} tabIndex={-1} className="pb-tabbar outline-none md:pb-0">
        <Outlet />
      </main>
      <TabBar />
      <AuthDialogHost />
      <ScrollRestoration />
    </>
  );
}
