import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../components/ui/ToastProvider';
import { createQueryClient } from '../lib/queryClient';
import { readToken, writeToken } from '../lib/token';
import { routes } from './router';
import { SessionProvider } from './SessionProvider';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={createQueryClient()}>
      <ToastProvider>
        <SessionProvider>
          <RouterProvider router={router} />
        </SessionProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
  return router;
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

describe('rute dan sesi', () => {
  it('menampilkan 404 untuk rute yang salah', async () => {
    renderAt('/tidak-ada');
    expect(await screen.findByText('Halaman tidak ditemukan')).toBeDefined();
  });

  it('meminta tamu masuk tanpa mengubah URL tujuan', async () => {
    const router = renderAt('/pesanan');
    expect(await screen.findByRole('dialog', { name: 'Masuk' }, { timeout: 5000 })).toBeDefined();
    expect(router.state.location.pathname).toBe('/pesanan');
  });

  it('menghapus token rusak dan membuka popup masuk (AT-02)', async () => {
    writeToken('rusak');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json(401, { success: false, message: 'Token tidak valid atau kedaluwarsa' })),
    );
    renderAt('/profil');
    expect(await screen.findByRole('dialog', { name: 'Masuk' }, { timeout: 5000 })).toBeDefined();
    expect(readToken()).toBeNull();
  });

  it('halaman publik tetap selesai memuat saat token kedaluwarsa', async () => {
    writeToken('kedaluwarsa');
    const listing = {
      _id: 'l1',
      owner: { _id: 'u2', name: 'Pemilik' },
      type: 'BARANG',
      title: 'Listing publik',
      description: 'Deskripsi',
      category: 'uji',
      price: 1000,
      priceUnit: 'ITEM',
      district: 'Plaju',
      images: [],
      status: 'ACTIVE',
      createdAt: '2026-11-25T00:00:00.000Z',
      updatedAt: '2026-11-25T00:00:00.000Z',
    };
    let rejectSession = () => {};
    let answerListing = () => {};
    const request = vi.fn(
      (url: string) =>
        new Promise<Response>((resolve) => {
          if (url.includes('/auth/me')) {
            rejectSession = () => resolve(json(401, { success: false, message: 'Token tidak valid atau kedaluwarsa' }));
          } else {
            answerListing = () => resolve(json(200, { success: true, data: listing }));
          }
        }),
    );
    vi.stubGlobal('fetch', request);
    renderAt('/listing/l1');
    // 401 datang saat request listing masih berjalan.
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2), { timeout: 5000 });
    rejectSession();
    await waitFor(() => expect(readToken()).toBeNull());
    answerListing();
    expect(await screen.findByRole('heading', { name: 'Listing publik' }, { timeout: 3000 })).toBeDefined();
  });

  it('memulihkan tujuan setelah masuk', async () => {
    const user = { _id: 'u1', name: 'Pengguna Uji', phone: '+6281234567890', district: 'Plaju', role: 'user' };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/auth/login')) return json(200, { success: true, data: { token: 't', user } });
        if (url.includes('/auth/me')) return json(200, { success: true, data: user });
        return json(200, { success: true, data: { items: [], page: 1, limit: 10, total: 0 } });
      }),
    );
    const router = renderAt('/pesanan');
    await screen.findByRole('dialog', { name: 'Masuk' }, { timeout: 5000 });

    fireEvent.input(screen.getByLabelText('Nomor HP atau email'), { target: { value: '081234567890' } });
    fireEvent.input(screen.getByLabelText('Password', { selector: 'input[autocomplete="current-password"]' }), {
      target: { value: 'rahasia123' },
    });
    fireEvent.submit(screen.getByLabelText('Nomor HP atau email').closest('form') as HTMLFormElement);

    expect(await screen.findByText('Kamu belum memesan apa pun', undefined, { timeout: 5000 })).toBeDefined();
    expect(router.state.location.pathname).toBe('/pesanan');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
