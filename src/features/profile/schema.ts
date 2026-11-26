import { z } from '../../lib/zod';
import { DISTRICTS } from '../../lib/constants';
import { requiredText } from '../../lib/schemas';

export const profileSchema = z.object({
  name: requiredText('Nama', 80),
  district: z.enum(DISTRICTS, { error: 'Pilih kecamatan' }),
  email: z
    .string()
    .trim()
    .max(120, 'Email maksimal 120 karakter')
    .refine(
      (value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      'Format email tidak valid, contoh: nama@contoh.com',
    ),
  avatarUrl: z
    .string()
    .trim()
    .max(2000, 'URL maksimal 2000 karakter')
    .refine((value) => value === '' || /^https:\/\/\S+$/i.test(value), 'Isi URL yang diawali https://'),
});
