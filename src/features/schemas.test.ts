// Memastikan batas validasi klien sama dengan server, lintas fitur.
import { describe, expect, it } from 'vitest';
import { registerSchema, isPhone, loginSchema } from './auth/schemas';
import { listingSchema } from './listings/listingSchema';
import { orderSchema } from './listings/orderSchema';
import { disputeSchema } from './orders/disputeSchema';
import { profileSchema } from './profile/schema';

const account = { name: 'Nama', phone: '0812-3456-7890', email: '', password: 'rahasia123', district: 'Plaju' };
const listing = {
  type: 'BARANG',
  title: 'Judul',
  description: 'Deskripsi',
  category: 'elektronik',
  price: '15000',
  priceUnit: 'ITEM',
  district: 'Sako',
  images: [],
};

const fields = (result: { error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.error?.issues.map((issue) => issue.path.join('.')) ?? [];

describe('daftar dan masuk', () => {
  it.each(['081234567890', '6281234567890', '+62 812 3456 7890', '81234567890'])('menerima nomor %s', (phone) => {
    expect(isPhone(phone)).toBe(true);
  });

  it.each(['0211234567', '08123', 'abc', ''])('menolak nomor %s', (phone) => {
    expect(isPhone(phone)).toBe(false);
  });

  it('menghitung password dalam byte', () => {
    expect(registerSchema.safeParse(account).success).toBe(true);
    expect(fields(registerSchema.safeParse({ ...account, password: '1234567' }))).toEqual(['password']);
    expect(registerSchema.safeParse({ ...account, password: 'a'.repeat(72) }).success).toBe(true);
    // 37 karakter dua byte = 74 byte.
    expect(fields(registerSchema.safeParse({ ...account, password: 'é'.repeat(37) }))).toEqual(['password']);
  });

  it('membatasi nama, email, dan kecamatan', () => {
    const result = registerSchema.safeParse({ ...account, name: 'a'.repeat(81), email: 'salah', district: 'Lain' });
    expect(fields(result)).toEqual(['name', 'email', 'district']);
    expect(loginSchema.safeParse({ identifier: ' ', password: '' }).success).toBe(false);
  });
});

describe('listing', () => {
  it('mengubah harga menjadi angka', () => {
    expect(listingSchema.parse(listing).price).toBe(15000);
  });

  it.each(['0', '1000000001', '1.5', '10.000', '-1', ''])('menolak harga "%s"', (price) => {
    // Resolver menampilkan satu pesan per field, jadi yang diperiksa field-nya.
    expect([...new Set(fields(listingSchema.safeParse({ ...listing, price })))]).toEqual(['price']);
  });

  it('menerima batas harga', () => {
    for (const price of ['1', '1000000000']) expect(listingSchema.safeParse({ ...listing, price }).success).toBe(true);
  });

  it('membatasi panjang teks dan jumlah foto', () => {
    const result = listingSchema.safeParse({
      ...listing,
      title: 'a'.repeat(121),
      description: 'a'.repeat(3001),
      category: 'a'.repeat(61),
      images: Array.from({ length: 9 }, () => ({ url: 'https://contoh.test/a.jpg' })),
    });
    expect(fields(result)).toEqual(['title', 'description', 'category', 'images']);
  });
});

describe('pesanan, sengketa, profil', () => {
  it('membatasi jumlah 1 sampai 365 dan catatan 500', () => {
    expect(orderSchema.parse({ quantity: '365', note: '' }).quantity).toBe(365);
    for (const quantity of ['0', '366', '1.5', '']) {
      expect(orderSchema.safeParse({ quantity, note: '' }).success).toBe(false);
    }
    expect(orderSchema.safeParse({ quantity: '1', note: 'a'.repeat(501) }).success).toBe(false);
  });

  it('mewajibkan alasan dan penjelasan sengketa', () => {
    expect(fields(disputeSchema.safeParse({ reason: '', description: '  ', evidence: [] }))).toEqual([
      'reason',
      'description',
    ]);
    expect(
      disputeSchema.safeParse({ reason: 'LAINNYA', description: 'a'.repeat(2000), evidence: [] }).success,
    ).toBe(true);
  });

  it('membolehkan email dan avatar dikosongkan', () => {
    expect(profileSchema.safeParse({ name: 'N', district: 'Gandus', email: '', avatarUrl: '' }).success).toBe(true);
  });
});
