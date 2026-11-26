import { z } from '../../lib/zod';
import type { Listing } from '../../lib/api/types';
import { DISTRICTS, LISTING_TYPES, PRICE_UNITS } from '../../lib/constants';
import { requiredText, urlItems } from '../../lib/schemas';

export const MAX_PRICE = 1_000_000_000;

export const listingSchema = z.object({
  type: z.enum(LISTING_TYPES, { error: 'Pilih tipe' }),
  title: requiredText('Judul', 120),
  description: requiredText('Deskripsi', 3000),
  category: requiredText('Kategori', 60),
  price: z
    .string()
    .trim()
    .min(1, 'Harga wajib diisi')
    .regex(/^\d+$/, 'Harga harus angka bulat tanpa titik atau koma')
    .transform(Number)
    .pipe(z.number().min(1, 'Harga minimal Rp1').max(MAX_PRICE, 'Harga maksimal Rp1.000.000.000')),
  priceUnit: z.enum(PRICE_UNITS, { error: 'Pilih satuan' }),
  district: z.enum(DISTRICTS, { error: 'Pilih kecamatan' }),
  images: urlItems,
});

export type ListingFormInput = z.input<typeof listingSchema>;
export type ListingFormOutput = z.output<typeof listingSchema>;

export function formValues(listing: Listing | undefined, district: string): ListingFormInput {
  return {
    type: listing?.type ?? 'BARANG',
    title: listing?.title ?? '',
    description: listing?.description ?? '',
    category: listing?.category ?? '',
    price: listing ? String(listing.price) : '',
    priceUnit: listing?.priceUnit ?? 'ITEM',
    district: (listing?.district ?? district) as ListingFormInput['district'],
    images: listing?.images.map((url) => ({ url })) ?? [],
  };
}

export function toPayload({ type: _type, images, ...values }: ListingFormOutput) {
  return { ...values, images: images.map((item) => item.url) };
}
