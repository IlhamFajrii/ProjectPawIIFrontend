import { describe, expect, it, vi } from 'vitest';
import type { Message } from '../../lib/api/types';
import { mergeMessages, nextAfter, PAGE_SIZE, pollMessages } from './messages';

const BASE = Date.parse('2026-11-25T10:00:00.000Z');

const message = (index: number, seconds = index): Message => ({
  _id: String(index).padStart(4, '0'),
  conversation: 'c',
  sender: 's',
  text: `pesan ${index}`,
  warning: false,
  createdAt: new Date(BASE + seconds * 1000).toISOString(),
});

describe('mergeMessages', () => {
  it('membuang duplikat berdasarkan _id dan mengurutkan menurut waktu', () => {
    const merged = mergeMessages([message(1), message(3)], [message(3), message(2)]);
    expect(merged.map((item) => item._id)).toEqual(['0001', '0002', '0003']);
  });

  it('mempertahankan referensi bila tidak ada yang baru', () => {
    const current = [message(1)];
    expect(mergeMessages(current, [message(1)])).toBe(current);
  });
});

describe('nextAfter', () => {
  it('mundur 5 detik dari pesan terakhir', () => {
    expect(nextAfter([message(1, 0), message(2, 20)])).toBe(new Date(BASE + 15_000).toISOString());
    expect(nextAfter([])).toBeUndefined();
  });
});

describe('pollMessages', () => {
  it('pengambilan pertama tanpa after', async () => {
    const load = vi.fn(async (_after?: string) => [message(1)]);
    await pollMessages([], load);
    expect(load.mock.calls).toEqual([[]]);
  });

  it('menangkap pesan yang tersimpan hampir bersamaan', async () => {
    // Pesan 2 bertanda waktu sebelum pesan terakhir, tetapi baru terlihat sekarang.
    const load = vi.fn(async (_after?: string) => [message(2, 8), message(3, 10)]);
    const result = await pollMessages([message(1, 0), message(3, 10)], load);
    expect(load).toHaveBeenCalledWith(new Date(BASE + 5000).toISOString());
    expect(result.map((item) => item._id)).toEqual(['0001', '0002', '0003']);
  });

  it('mengambil lagi selama halaman penuh', async () => {
    const all = Array.from({ length: 120 }, (_, index) => message(index + 1));
    const load = vi.fn(async (after?: string) =>
      all.filter((item) => item.createdAt > (after ?? '')).slice(0, PAGE_SIZE),
    );
    const result = await pollMessages([all[0] as Message], load);
    expect(result).toHaveLength(120);
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('tidak berputar tanpa akhir bila server mengulang halaman yang sama', async () => {
    const page = Array.from({ length: PAGE_SIZE }, (_, index) => message(index + 1, 1));
    const load = vi.fn(async (_after?: string) => page);
    await pollMessages([message(1, 1)], load);
    expect(load.mock.calls.length).toBeLessThanOrEqual(2);
  });
});
