import { api } from './client';
import type { Dispute, DisputeReason, Order, OrderStatus, Paginated } from './types';

export type OrderRole = 'buyer' | 'seller';
export type OrderTransition = 'pay' | 'process' | 'deliver' | 'confirm' | 'cancel';

export interface OrderFilters {
  role: OrderRole;
  status?: OrderStatus;
  page: number;
}

export const getOrders = ({ role, status, page }: OrderFilters, signal?: AbortSignal) =>
  api<Paginated<Order>>('/orders', { query: { role, status, page, limit: 10 }, signal });

export const getOrder = (id: string, signal?: AbortSignal) =>
  api<Order>(`/orders/${encodeURIComponent(id)}`, { signal });

export const createOrder = (body: { listingId: string; quantity: number; note?: string }) =>
  api<Order>('/orders', { method: 'POST', body });

export const transitionOrder = (id: string, action: OrderTransition) =>
  api<Order>(`/orders/${encodeURIComponent(id)}/${action}`, { method: 'POST' });

export const openDispute = (id: string, body: { reason: DisputeReason; description: string; evidence: string[] }) =>
  api<Dispute>(`/orders/${encodeURIComponent(id)}/dispute`, { method: 'POST', body });
