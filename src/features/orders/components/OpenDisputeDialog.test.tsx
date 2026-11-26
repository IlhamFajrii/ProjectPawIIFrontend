import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Order } from '../../../lib/api/types';
import { OpenDisputeDialog } from './OpenDisputeDialog';

vi.mock('../../../lib/session', () => ({ useCurrentUser: () => ({ _id: 'u1' }) }));
vi.mock('../../../lib/toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }));

const order = { _id: 'o1', listing: 'l1', listingSnapshot: { type: 'BARANG' } } as unknown as Order;

describe('bukti sengketa', () => {
  it('hanya menerima unggahan foto, tanpa isian URL', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <OpenDisputeDialog order={order} open onClose={() => {}} />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Pilih foto (0/8)')).toBeDefined();
    expect(document.querySelector('input[type="file"]')).not.toBeNull();
    expect(document.querySelector('input[type="url"]')).toBeNull();
    expect(screen.queryByText(/Tambah URL/)).toBeNull();
  });
});
