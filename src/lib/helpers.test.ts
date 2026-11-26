import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './api/client';
import { findAcrossPages } from './api/pages';
import { applyServerErrors, flattenErrors } from './formErrors';
import { urlItem } from './schemas';
import { safeNextPath, safeUrl } from './url';

describe('safeUrl', () => {
  it('hanya menerima http dan https', () => {
    expect(safeUrl('https://contoh.test/a.jpg')).toBe('https://contoh.test/a.jpg');
    expect(safeUrl('http://contoh.test/a.jpg')).toBeDefined();
    for (const value of ['javascript:alert(1)', 'data:image/png;base64,AA', '//contoh.test', 'https:// ada spasi', '']) {
      expect(safeUrl(value)).toBeUndefined();
    }
  });

  it('formulir hanya menerima https (G-01)', () => {
    expect(urlItem.safeParse({ url: 'https://contoh.test/a.jpg' }).success).toBe(true);
    expect(urlItem.safeParse({ url: 'http://contoh.test/a.jpg' }).success).toBe(false);
    expect(urlItem.safeParse({ url: '' }).success).toBe(false);
  });
});

describe('safeNextPath', () => {
  it('menolak tujuan ke luar aplikasi', () => {
    expect(safeNextPath('/pesanan/1?peran=jual')).toBe('/pesanan/1?peran=jual');
    for (const value of ['https://jahat.test', '//jahat.test', '/\\jahat.test', '/\t/jahat.test', 'pesanan', null]) {
      expect(safeNextPath(value)).toBe('/');
    }
  });
});

describe('applyServerErrors', () => {
  it('memetakan images.0 ke field form', () => {
    const setError = vi.fn();
    const error = new ApiError(400, 'Data tidak valid', [
      { field: 'images.0', message: 'harus berupa URL http atau https' },
      { field: 'title', message: 'wajib diisi' },
      { field: 'owner', message: 'tidak valid' },
    ]);

    expect(applyServerErrors(error, setError, ['title', 'images'])).toBe('Data tidak valid');
    expect(setError.mock.calls.map(([path, value]) => [path, value.message])).toEqual([
      ['images.0.url', 'Harus berupa URL http atau https'],
      ['title', 'Wajib diisi'],
    ]);
  });

  it('menebak field untuk pesan tanpa daftar', () => {
    const setError = vi.fn();
    applyServerErrors(new ApiError(409, 'Email sudah terdaftar'), setError, ['email'], () => 'email');
    expect(setError).toHaveBeenCalledWith('email', { type: 'server', message: 'Email sudah terdaftar' });
  });

  it('meratakan error bertingkat', () => {
    expect(
      flattenErrors({ title: { message: 'A' }, images: [undefined, { url: { message: 'B' } }] }),
    ).toEqual([
      { name: 'title', message: 'A' },
      { name: 'images.1.url', message: 'B' },
    ]);
  });
});

describe('findAcrossPages', () => {
  const load = vi.fn(async (page: number) => ({ items: [`item-${page}`], page, limit: 1, total: 3 }));

  it('menemukan item di halaman berikutnya', async () => {
    await expect(findAcrossPages(load, (item) => item === 'item-3')).resolves.toBe('item-3');
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('berhenti setelah halaman terakhir', async () => {
    load.mockClear();
    await expect(findAcrossPages(load, () => false)).resolves.toBeNull();
    expect(load).toHaveBeenCalledTimes(3);
  });
});
