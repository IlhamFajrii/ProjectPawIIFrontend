import { api } from './client';
import { findAcrossPages, MAX_LIMIT } from './pages';
import type { Dispute, DisputeResolution, DisputeStatus, Paginated } from './types';

export const getDisputes = (
  { status, page, limit = 10 }: { status?: DisputeStatus; page: number; limit?: number },
  signal?: AbortSignal,
) => api<Paginated<Dispute>>('/disputes', { query: { status, page, limit }, signal });

export const getDispute = (id: string, signal?: AbortSignal) =>
  api<Dispute>(`/disputes/${encodeURIComponent(id)}`, { signal });

/** Detail pesanan tidak membawa ID sengketa (G-07), jadi dicocokkan lewat `order._id`. */
export const findDisputeByOrder = (orderId: string) =>
  findAcrossPages(
    (page) => getDisputes({ page, limit: MAX_LIMIT }),
    (dispute) => (typeof dispute.order === 'string' ? dispute.order : dispute.order._id) === orderId,
  );

export const resolveDispute = (id: string, body: { resolution: DisputeResolution; adminNote?: string }) =>
  api<Dispute>(`/disputes/${encodeURIComponent(id)}/resolve`, { method: 'PUT', body });
