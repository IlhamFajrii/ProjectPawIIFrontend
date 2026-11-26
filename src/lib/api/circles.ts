import { api } from './client';
import type { Circle, CircleDetail } from './types';

const path = (id: string) => `/circles/${encodeURIComponent(id)}`;

export const getMyCircles = (signal?: AbortSignal) => api<Circle[]>('/circles/mine', { signal });
export const getCircle = (id: string, signal?: AbortSignal) => api<CircleDetail>(path(id), { signal });
export const createCircle = (name: string) => api<Circle>('/circles', { method: 'POST', body: { name } });
export const joinCircle = (inviteCode: string) =>
  api<Circle>('/circles/join', { method: 'POST', body: { inviteCode } });
export const leaveCircle = (id: string) => api<{ left: boolean }>(`${path(id)}/members/me`, { method: 'DELETE' });
export const giveVouch = (id: string, userId: string) =>
  api<unknown>(`${path(id)}/vouches`, { method: 'POST', body: { userId } });
export const revokeVouch = (id: string, userId: string) =>
  api<{ revoked: boolean }>(`${path(id)}/vouches/${encodeURIComponent(userId)}`, { method: 'DELETE' });
