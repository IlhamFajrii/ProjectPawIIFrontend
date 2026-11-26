import type { OrderStatus } from '../../lib/api/types';

export const STAGES: { status: OrderStatus; title: string; body: string; money: string }[] = [
  {
    status: 'PENDING_PAYMENT',
    title: 'Kamu memesan',
    body: 'Pilih listing, tentukan jumlah, lalu kirim pesanan. Belum ada dana yang ditahan.',
    money: 'belum dibayar',
  },
  {
    status: 'HELD_IN_ESCROW',
    title: 'Dibayar, dana ditahan',
    body: 'Setelah kamu membayar, dana ditandai ditahan. Penjual belum menerimanya.',
    money: 'ditahan',
  },
  {
    status: 'IN_PROGRESS',
    title: 'Penjual memproses',
    body: 'Penjual menyiapkan barang atau mulai mengerjakan jasa.',
    money: 'ditahan',
  },
  {
    status: 'DELIVERED',
    title: 'Pesanan terkirim',
    body: 'Penjual menandai terkirim. Periksa dulu. Kalau bermasalah, ajukan sengketa.',
    money: 'ditahan',
  },
  {
    status: 'COMPLETED',
    title: 'Kamu konfirmasi, selesai',
    body: 'Baru sekarang dana diteruskan ke penjual.',
    money: 'diteruskan',
  },
];
