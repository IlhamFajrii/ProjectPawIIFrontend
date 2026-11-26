import { z } from './zod';

export const MAX_URLS = 8;

/** Teks wajib dengan batas yang sama dengan server. */
export const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .max(max, `${label} maksimal ${max} karakter`);

export const urlItem = z.object({
  url: z
    .string()
    .trim()
    .max(2000, 'URL maksimal 2000 karakter')
    .regex(/^https:\/\/\S+$/i, 'Isi URL yang diawali https://, atau hapus baris ini'),
});

export const urlItems = z.array(urlItem).max(MAX_URLS, `Maksimal ${MAX_URLS} URL`);
