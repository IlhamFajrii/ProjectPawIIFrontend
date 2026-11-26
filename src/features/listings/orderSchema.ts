import { z } from '../../lib/zod';

export const orderSchema = z.object({
  quantity: z
    .string()
    .regex(/^\d+$/, 'Jumlah harus angka bulat')
    .transform(Number)
    .pipe(z.number().min(1, 'Jumlah minimal 1').max(365, 'Jumlah maksimal 365')),
  note: z.string().trim().max(500, 'Catatan maksimal 500 karakter'),
});
