import type { OrderRole, OrderTransition } from './api/orders';
import type { OrderStatus } from './api/types';

export type OrderAction = OrderTransition | 'dispute' | 'viewDispute';

const ACTIONS: Record<OrderStatus, Record<OrderRole, readonly OrderAction[]>> = {
  PENDING_PAYMENT: { buyer: ['pay', 'cancel'], seller: ['cancel'] },
  HELD_IN_ESCROW: { buyer: ['dispute'], seller: ['process', 'dispute'] },
  IN_PROGRESS: { buyer: ['dispute'], seller: ['deliver', 'dispute'] },
  DELIVERED: { buyer: ['confirm', 'dispute'], seller: ['dispute'] },
  COMPLETED: { buyer: [], seller: [] },
  CANCELLED: { buyer: [], seller: [] },
  DISPUTED: { buyer: ['viewDispute'], seller: ['viewDispute'] },
  REFUNDED: { buyer: [], seller: [] },
};

/** Aksi sah menurut status dan peran. Server tetap penentu akhir. */
export const getOrderActions = (status: OrderStatus, role: OrderRole) => ACTIONS[status][role];

export const ORDER_ACTION_LABEL: Record<OrderAction, string> = {
  pay: 'Bayar',
  process: 'Proses pesanan',
  deliver: 'Tandai terkirim',
  confirm: 'Konfirmasi selesai',
  cancel: 'Batalkan pesanan',
  dispute: 'Ajukan sengketa',
  viewDispute: 'Lihat sengketa',
};
