import { describe, expect, it } from 'vitest';
import type { OrderRole } from './api/orders';
import type { OrderStatus } from './api/types';
import { ORDER_STATUSES } from './constants';
import { getOrderActions, type OrderAction } from './orderActions';

// Salinan backend/src/utils/orderStatus.js (aksi pengguna saja).
const BACKEND: Record<string, { from: OrderStatus[]; by: OrderRole[] }> = {
  pay: { from: ['PENDING_PAYMENT'], by: ['buyer'] },
  cancel: { from: ['PENDING_PAYMENT'], by: ['buyer', 'seller'] },
  process: { from: ['HELD_IN_ESCROW'], by: ['seller'] },
  deliver: { from: ['IN_PROGRESS'], by: ['seller'] },
  confirm: { from: ['DELIVERED'], by: ['buyer'] },
  dispute: { from: ['HELD_IN_ESCROW', 'IN_PROGRESS', 'DELIVERED'], by: ['buyer', 'seller'] },
};

// Tabel PRD 5.3.
const PRD: [OrderStatus, OrderAction[], OrderAction[]][] = [
  ['PENDING_PAYMENT', ['pay', 'cancel'], ['cancel']],
  ['HELD_IN_ESCROW', ['dispute'], ['process', 'dispute']],
  ['IN_PROGRESS', ['dispute'], ['deliver', 'dispute']],
  ['DELIVERED', ['confirm', 'dispute'], ['dispute']],
  ['COMPLETED', [], []],
  ['CANCELLED', [], []],
  ['DISPUTED', ['viewDispute'], ['viewDispute']],
  ['REFUNDED', [], []],
];

describe('getOrderActions', () => {
  it('mencakup semua status', () => {
    expect(PRD.map(([status]) => status)).toEqual([...ORDER_STATUSES]);
  });

  it.each(PRD)('%s sesuai tabel PRD', (status, buyer, seller) => {
    expect(getOrderActions(status, 'buyer')).toEqual(buyer);
    expect(getOrderActions(status, 'seller')).toEqual(seller);
  });

  const cases = ORDER_STATUSES.flatMap((status) => (['buyer', 'seller'] as const).map((role) => [status, role] as const));

  it.each(cases)('%s untuk %s sama dengan aturan backend', (status, role) => {
    const allowed = Object.entries(BACKEND)
      .filter(([, rule]) => rule.from.includes(status) && rule.by.includes(role))
      .map(([action]) => action);
    const shown = getOrderActions(status, role).filter((action) => action !== 'viewDispute');
    expect([...shown].sort()).toEqual(allowed.sort());
  });
});
