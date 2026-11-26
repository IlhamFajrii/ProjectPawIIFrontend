import { afterEach, describe, expect, it, vi } from 'vitest';
import { writeToken } from '../token';
import { api, ApiError, buildUrl, setUnauthorizedHandler } from './client';

const respond = (status: number, body: unknown) =>
  vi.fn(async (_url: string, _init: RequestInit) => new Response(body === undefined ? '' : JSON.stringify(body), { status }));

const failure = async (promise: Promise<unknown>) => {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
};

afterEach(() => {
  setUnauthorizedHandler(null);
  writeToken(null);
});

describe('buildUrl', () => {
  it('mengisi tiap parameter sekali dan melewati yang kosong', () => {
    expect(buildUrl('/listings', { q: 'tenda biru', type: undefined, district: '', page: 2 })).toBe(
      '/api/listings?q=tenda+biru&page=2',
    );
  });

  it('memakai VITE_API_URL tanpa garis miring ganda', () => {
    vi.stubEnv('VITE_API_URL', 'https://contoh.test/');
    expect(buildUrl('/health')).toBe('https://contoh.test/api/health');
  });
});

describe('api', () => {
  it('membuka { success, data } dan menempelkan token', async () => {
    const request = respond(200, { success: true, data: { status: 'ok' } });
    vi.stubGlobal('fetch', request);
    writeToken('token-1');

    await expect(api('/health')).resolves.toEqual({ status: 'ok' });
    expect(request.mock.calls[0]?.[1].headers).toEqual({ Authorization: 'Bearer token-1' });
  });

  it('mengirim body JSON', async () => {
    const request = respond(201, { success: true, data: {} });
    vi.stubGlobal('fetch', request);

    await api('/circles', { method: 'POST', body: { name: 'RT' } });
    expect(request.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      body: '{"name":"RT"}',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('melempar ApiError dengan errors[] dari server', async () => {
    const errors = [{ field: 'images.0', message: 'harus berupa URL http atau https' }];
    vi.stubGlobal('fetch', respond(400, { success: false, message: 'Data tidak valid', errors }));

    await expect(failure(api('/listings'))).resolves.toMatchObject({ status: 400, message: 'Data tidak valid', errors });
  });

  it('memanggil penangan 401 dengan token yang dipakai', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    writeToken('token-lama');
    vi.stubGlobal('fetch', respond(401, { success: false, message: 'Token tidak valid atau kedaluwarsa' }));

    await failure(api('/auth/me'));
    expect(handler).toHaveBeenCalledWith('token-lama');
  });

  it('tidak memanggil penangan untuk 401 dari /auth/login', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.stubGlobal('fetch', respond(401, { success: false, message: 'Nomor HP/email atau password salah' }));

    const error = await failure(api('/auth/login', { method: 'POST', body: {} }));
    expect(error.message).toBe('Nomor HP/email atau password salah');
    expect(handler).not.toHaveBeenCalled();
  });

  it('menandai jaringan gagal dengan status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const error = await failure(api('/health'));
    expect(error.status).toBe(0);
    expect(error.message).toContain('Tidak bisa terhubung');
  });

  it.each([
    [413, 'Ukuran data terlalu besar.'],
    [502, 'Server sedang bermasalah. Coba lagi sebentar lagi.'],
  ])('memberi pesan cadangan untuk %i tanpa JSON', async (status, message) => {
    vi.stubGlobal('fetch', respond(status, undefined));
    await expect(failure(api('/health'))).resolves.toMatchObject({ status, message });
  });

  it('menganggap 200 yang bukan JSON sebagai gagal', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html></html>', { status: 200 })));
    await expect(failure(api('/health'))).resolves.toMatchObject({ status: 502 });
  });
});
