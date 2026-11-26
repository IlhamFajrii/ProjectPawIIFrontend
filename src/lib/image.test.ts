import { describe, expect, it, vi } from 'vitest';
import { MAX_IMAGE_BYTES, prepareImage, scaleDown, shrinkToLimit, sniffImageType } from './image';

const bytes = (...values: number[]) => new Uint8Array(values);
const JPEG = [0xff, 0xd8, 0xff, 0xe0];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const WEBP = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];

describe('sniffImageType', () => {
  it('mengenali JPEG, PNG, dan WebP dari isinya', () => {
    expect(sniffImageType(bytes(...JPEG))).toBe('image/jpeg');
    expect(sniffImageType(bytes(...PNG))).toBe('image/png');
    expect(sniffImageType(bytes(...WEBP))).toBe('image/webp');
    expect(sniffImageType(bytes(0x47, 0x49, 0x46, 0x38))).toBeNull();
  });
});

describe('scaleDown', () => {
  it('mengecilkan sisi terpanjang dan menjaga rasio', () => {
    expect(scaleDown(4000, 3000, 2000)).toEqual({ width: 2000, height: 1500 });
    expect(scaleDown(1000, 4000, 2000)).toEqual({ width: 500, height: 2000 });
  });

  it('tidak memperbesar', () => {
    expect(scaleDown(800, 600, 2000)).toEqual({ width: 800, height: 600 });
  });
});

describe('shrinkToLimit', () => {
  it('berhenti pada ukuran pertama yang muat', async () => {
    const render = vi.fn(async (side: number) => ({ size: side > 1500 ? MAX_IMAGE_BYTES + 1 : MAX_IMAGE_BYTES, side }));
    await expect(shrinkToLimit(render)).resolves.toMatchObject({ side: 1280 });
    expect(render).toHaveBeenCalledTimes(3);
  });

  it('menyerah bila semua ukuran masih terlalu besar', async () => {
    await expect(shrinkToLimit(async () => ({ size: MAX_IMAGE_BYTES + 1 }))).resolves.toBeNull();
  });
});

describe('prepareImage', () => {
  it('mengirim foto kecil apa adanya, tanpa awalan data URL', async () => {
    // Nama dan tipe yang diklaim salah; isi file yang menentukan.
    const file = new Blob([bytes(...JPEG)], { type: 'image/png' });
    await expect(prepareImage(file)).resolves.toEqual({ imageBase64: '/9j/4A==', mimeType: 'image/jpeg', resized: false });
  });

  it('menolak file yang bukan foto', async () => {
    await expect(prepareImage(new Blob(['halo']))).rejects.toThrow('JPEG, PNG, atau WebP');
  });
});
