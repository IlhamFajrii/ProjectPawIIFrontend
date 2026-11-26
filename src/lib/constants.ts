// Salinan enum dan kecamatan dari backend/src/utils/constants.js, beserta label UI-nya.
import type {
  DisputeReason,
  DisputeResolution,
  DisputeStatus,
  ListingStatus,
  ListingType,
  OrderStatus,
  PriceUnit,
} from './api/types';

export const DISTRICTS = [
  'Alang-Alang Lebar', 'Bukit Kecil', 'Gandus', 'Ilir Barat I', 'Ilir Barat II',
  'Ilir Timur I', 'Ilir Timur II', 'Ilir Timur III', 'Jakabaring', 'Kalidoni',
  'Kemuning', 'Kertapati', 'Plaju', 'Sako', 'Seberang Ulu I', 'Seberang Ulu II',
  'Sematang Borang', 'Sukarami',
] as const;

export const LISTING_TYPES = ['BARANG', 'SEWA', 'JASA', 'TUGAS'] as const satisfies readonly ListingType[];
export const PRICE_UNITS = ['ITEM', 'HARI', 'JAM', 'KUNJUNGAN', 'TRIP'] as const satisfies readonly PriceUnit[];
export const ORDER_STATUSES = [
  'PENDING_PAYMENT', 'HELD_IN_ESCROW', 'IN_PROGRESS', 'DELIVERED',
  'COMPLETED', 'CANCELLED', 'DISPUTED', 'REFUNDED',
] as const satisfies readonly OrderStatus[];
export const DISPUTE_REASONS = [
  'BARANG_TIDAK_SESUAI', 'BARANG_TIDAK_DIKIRIM', 'JASA_TIDAK_SELESAI', 'LAINNYA',
] as const satisfies readonly DisputeReason[];
export const DISPUTE_RESOLUTIONS = ['RELEASE', 'REFUND'] as const satisfies readonly DisputeResolution[];

export const LISTING_TYPE_LABEL: Record<ListingType, string> = {
  BARANG: 'Barang',
  SEWA: 'Sewa',
  JASA: 'Jasa',
  TUGAS: 'Tugas',
};

export const PRICE_UNIT_LABEL: Record<PriceUnit, string> = {
  ITEM: 'item',
  HARI: 'hari',
  JAM: 'jam',
  KUNJUNGAN: 'kunjungan',
  TRIP: 'trip',
};

export const QUANTITY_LABEL: Record<PriceUnit, string> = {
  ITEM: 'Jumlah',
  HARI: 'Jumlah hari',
  JAM: 'Jumlah jam',
  KUNJUNGAN: 'Jumlah kunjungan',
  TRIP: 'Jumlah trip',
};

export const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  ACTIVE: 'Tersedia',
  RESERVED: 'Sedang dipesan',
  SOLD: 'Terjual',
  INACTIVE: 'Nonaktif',
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Menunggu pembayaran',
  HELD_IN_ESCROW: 'Dana ditahan',
  IN_PROGRESS: 'Diproses',
  DELIVERED: 'Terkirim',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
  DISPUTED: 'Dalam sengketa',
  REFUNDED: 'Dana dikembalikan',
};

export const DISPUTE_REASON_LABEL: Record<DisputeReason, string> = {
  BARANG_TIDAK_SESUAI: 'Barang tidak sesuai',
  BARANG_TIDAK_DIKIRIM: 'Barang tidak dikirim',
  JASA_TIDAK_SELESAI: 'Jasa tidak selesai',
  LAINNYA: 'Lainnya',
};

export const DISPUTE_STATUS_LABEL: Record<DisputeStatus, string> = {
  OPEN: 'Menunggu putusan',
  RESOLVED: 'Sudah diputus',
};

export const DISPUTE_RESOLUTION_LABEL: Record<DisputeResolution, string> = {
  RELEASE: 'Dana diteruskan ke penjual',
  REFUND: 'Dana dikembalikan ke pembeli',
};

export const ESCROW_NOTICE = 'Rekber di PUNYA adalah simulasi: tidak ada uang yang berpindah.';

/** Membaca nilai dari input atau URL, hanya bila termasuk daftar yang sah. */
export function oneOf<T extends string>(list: readonly T[], value: unknown): T | undefined {
  return list.find((item) => item === value);
}
