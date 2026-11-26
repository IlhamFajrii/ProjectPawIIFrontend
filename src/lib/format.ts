import type { PriceUnit } from './api/types';
import { PRICE_UNIT_LABEL } from './constants';

const TIME_ZONE = 'Asia/Jakarta';

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const date = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeZone: TIME_ZONE });
const dateTime = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: TIME_ZONE });
const time = new Intl.DateTimeFormat('id-ID', { timeStyle: 'short', timeZone: TIME_ZONE });
const shortDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', timeZone: TIME_ZONE });
const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE });

/** Intl menyisipkan spasi tak terputus setelah "Rp"; dibuang agar rapat dan konsisten. */
export const formatRupiah = (value: number) => rupiah.format(value).replace(/\s/g, '');

export const formatPrice = (price: number, unit: PriceUnit) =>
  `${formatRupiah(price)} / ${PRICE_UNIT_LABEL[unit]}`;

function format(formatter: Intl.DateTimeFormat, iso: string | undefined) {
  const value = new Date(iso ?? '');
  return Number.isNaN(value.getTime()) ? '' : formatter.format(value);
}

export const formatDate = (iso?: string) => format(date, iso);
export const formatDateTime = (iso?: string) => format(dateTime, iso);
export const formatTime = (iso?: string) => format(time, iso);

/** Jam untuk hari ini, tanggal pendek untuk hari lain. */
export function formatChatTime(iso: string, now = new Date()) {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return '';
  return dayKey.format(value) === dayKey.format(now) ? time.format(value) : shortDate.format(value);
}
