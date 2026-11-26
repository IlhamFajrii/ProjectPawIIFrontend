import { describe, expect, it } from 'vitest';
import { formatChatTime, formatDate, formatDateTime, formatPrice, formatRupiah } from './format';

describe('format', () => {
  it('menulis rupiah tanpa desimal', () => {
    expect(formatRupiah(75000)).toBe('Rp75.000');
    expect(formatRupiah(1_000_000_000)).toBe('Rp1.000.000.000');
    expect(formatPrice(15000, 'KUNJUNGAN')).toBe('Rp15.000 / kunjungan');
  });

  it('memakai zona Asia/Jakarta', () => {
    // 18.30 UTC sudah masuk hari berikutnya di Jakarta.
    expect(formatDate('2026-11-24T18:30:00.000Z')).toBe('25 November 2026');
    expect(formatDateTime('2026-11-25T05:05:00.000Z')).toContain('12.05');
  });

  it('mengembalikan teks kosong untuk tanggal tidak valid', () => {
    expect(formatDate(undefined)).toBe('');
    expect(formatDateTime('bukan tanggal')).toBe('');
  });

  it('menulis jam untuk hari ini dan tanggal untuk hari lain', () => {
    const now = new Date('2026-11-25T10:00:00.000Z');
    expect(formatChatTime('2026-11-25T01:00:00.000Z', now)).toBe('08.00');
    expect(formatChatTime('2026-11-20T01:00:00.000Z', now)).toBe('20 Nov');
  });
});
