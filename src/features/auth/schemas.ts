import { z } from '../../lib/zod';
import { DISTRICTS } from '../../lib/constants';
import { requiredText } from '../../lib/schemas';

// Sama dengan backend/src/utils/phone.js: "0812-...", "62812...", "+62812...", "812...".
export const isPhone = (input: string) =>
  /^\+628\d{7,11}$/.test(input.replace(/[\s-]/g, '').replace(/^(\+62|62|0)?/, '+62'));

export const isEmail = (input: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

/** Email boleh kosong. */
export const optionalEmail = z
  .string()
  .trim()
  .max(120, 'Email maksimal 120 karakter')
  .refine((value) => value === '' || isEmail(value), 'Format email tidak valid, contoh: nama@contoh.com');

export const district = z.enum(DISTRICTS, { error: 'Pilih kecamatan' });

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Isi nomor HP atau email'),
  password: z.string().min(1, 'Isi password'),
});

export const registerSchema = z.object({
  name: requiredText('Nama', 80),
  phone: z.string().trim().refine(isPhone, 'Nomor HP tidak valid, contoh: 081234567890'),
  email: optionalEmail,
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    // bcrypt hanya memakai 72 byte pertama, jadi batasnya dihitung dalam byte.
    .refine((value) => new TextEncoder().encode(value).length <= 72, 'Password maksimal 72 byte'),
  district,
});
