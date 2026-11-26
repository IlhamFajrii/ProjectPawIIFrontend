import type { ComponentType } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { LoadingBlock } from '../components/ui/Skeleton';
import { RequireAuth } from './RequireAuth';
import { RootLayout } from './RootLayout';
import { RouteError } from './RouteError';

/** Setiap halaman menjadi potongan sendiri. */
const page = (load: () => Promise<{ default: ComponentType }>) => ({
  lazy: async () => ({ Component: (await load()).default }),
});

const auth = page(() => import('../features/auth/pages/AuthPage'));
const chat = page(() => import('../features/chat/pages/ChatPage'));

const publicRoutes: RouteObject[] = [
  { index: true, ...page(() => import('../features/landing/pages/LandingPage')) },
  { path: 'jelajah', ...page(() => import('../features/listings/pages/BrowsePage')) },
  { path: 'listing/:id', ...page(() => import('../features/listings/pages/ListingDetailPage')) },
  { path: 'masuk', ...auth },
  { path: 'daftar', ...auth },
  { path: 'pengguna/:id', ...page(() => import('../features/profile/pages/PublicProfilePage')) },
];

const privateRoutes: RouteObject[] = [
  { path: 'jual', ...page(() => import('./SellPage')) },
  { path: 'listing/:id/ubah', ...page(() => import('../features/listings/pages/EditListingPage')) },
  { path: 'saya/listing', ...page(() => import('../features/listings/pages/MyListingsPage')) },
  { path: 'profil', ...page(() => import('../features/profile/pages/ProfilePage')) },
  { path: 'pesanan', ...page(() => import('../features/orders/pages/OrdersPage')) },
  { path: 'pesanan/:id', ...page(() => import('../features/orders/pages/OrderDetailPage')) },
  { path: 'sengketa', ...page(() => import('../features/disputes/pages/DisputesPage')) },
  { path: 'sengketa/:id', ...page(() => import('../features/disputes/pages/DisputeDetailPage')) },
  { path: 'pesan', ...chat },
  { path: 'pesan/:id', ...chat },
  { path: 'circle', ...page(() => import('../features/circles/pages/CirclesPage')) },
  { path: 'circle/:id', ...page(() => import('../features/circles/pages/CircleDetailPage')) },
];

// Halaman pratinjau komponen hanya ada saat development.
if (import.meta.env.DEV) {
  publicRoutes.push({ path: '_pratinjau', ...page(() => import('./preview/PreviewPage')) });
}

export const routes: RouteObject[] = [
  {
    path: '/',
    Component: RootLayout,
    HydrateFallback: () => (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <LoadingBlock label="Memuat halaman" />
      </div>
    ),
    ErrorBoundary: RouteError,
    children: [
      {
        // Error di halaman tidak ikut menghilangkan navigasi.
        ErrorBoundary: RouteError,
        children: [
          ...publicRoutes,
          { Component: RequireAuth, children: privateRoutes },
          { path: '*', ...page(() => import('./NotFoundPage')) },
        ],
      },
    ],
  },
];

export const createRouter = () => createBrowserRouter(routes);
