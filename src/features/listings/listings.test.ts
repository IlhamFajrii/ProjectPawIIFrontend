import { describe, expect, it } from 'vitest';
import type { Listing } from '../../lib/api/types';
import { listingAccess } from './access';
import { parseFilters, withParams } from './filters';
import { formValues, listingSchema, toPayload } from './listingSchema';

describe('parseFilters', () => {
  it('membuang nilai yang tidak sah', () => {
    const filters = parseFilters(new URLSearchParams('type=MOBIL&district=Lain&minPrice=-5&maxPrice=abc&page=0&q=%20'));
    expect(filters).toEqual({
      q: undefined,
      type: undefined,
      district: undefined,
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      page: 1,
      limit: 12,
    });
  });

  it('membaca filter dan menurunkan huruf kategori', () => {
    expect(parseFilters(new URLSearchParams('type=SEWA&category=Kamera&minPrice=1000&page=3'))).toMatchObject({
      type: 'SEWA',
      category: 'kamera',
      minPrice: 1000,
      page: 3,
    });
  });
});

describe('withParams', () => {
  const current = new URLSearchParams('q=tenda&page=3&lihat=abc');

  it('kembali ke halaman 1 saat filter berubah dan menutup quick view', () => {
    expect(withParams(current, { type: 'SEWA' }).toString()).toBe('q=tenda&type=SEWA');
  });

  it('menyimpan nomor halaman', () => {
    expect(withParams(current, { page: '2' }).toString()).toBe('q=tenda&page=2');
    expect(withParams(current, { page: '1' }).toString()).toBe('q=tenda');
  });
});

const listing = (status: Listing['status'], owner: Listing['owner'] = 'pemilik'): Listing => ({
  _id: 'l',
  owner,
  type: 'BARANG',
  title: 'Judul',
  description: 'Deskripsi',
  category: 'elektronik',
  price: 1000,
  priceUnit: 'ITEM',
  district: 'Sako',
  images: ['https://contoh.test/a.jpg'],
  status,
  createdAt: '',
  updatedAt: '',
});

describe('listingAccess', () => {
  it('tamu dan orang lain boleh memesan listing aktif', () => {
    expect(listingAccess(listing('ACTIVE'))).toEqual({ isOwner: false, orderBlock: null });
    expect(listingAccess(listing('ACTIVE'), 'orang-lain').orderBlock).toBeNull();
  });

  it('mengenali pemilik dari ID maupun objek', () => {
    expect(listingAccess(listing('ACTIVE'), 'pemilik').isOwner).toBe(true);
    expect(listingAccess(listing('ACTIVE', { _id: 'pemilik', name: 'P' }), 'pemilik').isOwner).toBe(true);
  });

  it.each([
    ['RESERVED', 'Sedang dipesan orang lain.'],
    ['SOLD', 'Sudah terjual.'],
  ] as const)('menjelaskan alasan untuk %s', (status, reason) => {
    expect(listingAccess(listing(status)).orderBlock).toBe(reason);
  });
});

describe('form listing', () => {
  it('payload ubah tidak membawa type', () => {
    const parsed = listingSchema.parse(formValues(listing('ACTIVE'), 'Plaju'));
    const payload = toPayload(parsed);
    expect(payload).not.toHaveProperty('type');
    expect(payload.images).toEqual(['https://contoh.test/a.jpg']);
    expect(payload.price).toBe(1000);
  });
});
