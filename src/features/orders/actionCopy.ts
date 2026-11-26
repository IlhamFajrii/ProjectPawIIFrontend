import type { OrderTransition } from '../../lib/api/orders';

interface Copy {
  title: string;
  body: string;
  confirm: string;
  success: string;
  destructive?: boolean;
}

/** Isi popup konfirmasi (PU-06, PU-07). */
export const ACTION_COPY: Record<OrderTransition, Copy> = {
  pay: {
    title: 'Bayar pesanan',
    body: 'Dana akan ditandai ditahan sampai pembeli mengonfirmasi pesanan selesai.',
    confirm: 'Bayar',
    success: 'Pembayaran simulasi tercatat. Dana ditahan.',
  },
  process: {
    title: 'Proses pesanan?',
    body: 'Pembeli akan melihat bahwa pesanan sedang kamu kerjakan.',
    confirm: 'Proses pesanan',
    success: 'Pesanan ditandai diproses.',
  },
  deliver: {
    title: 'Tandai terkirim?',
    body: 'Pastikan barang atau jasa sudah diterima pembeli. Setelah ini pembeli diminta mengonfirmasi.',
    confirm: 'Tandai terkirim',
    success: 'Pesanan ditandai terkirim.',
  },
  confirm: {
    title: 'Konfirmasi pesanan selesai?',
    body: 'Dana diteruskan ke penjual. Setelah selesai, sengketa tidak bisa diajukan lagi.',
    confirm: 'Konfirmasi selesai',
    success: 'Pesanan selesai.',
  },
  cancel: {
    title: 'Batalkan pesanan?',
    body: 'Pesanan yang dibatalkan tidak bisa diaktifkan lagi.',
    confirm: 'Batalkan pesanan',
    success: 'Pesanan dibatalkan.',
    destructive: true,
  },
};
