import { api } from './client';
import type { PublicProfile, User } from './types';

export interface ProfileInput {
  name: string;
  district: string;
  email: string;
  avatarUrl: string;
}

export const updateProfile = (body: ProfileInput) => api<User>('/users/me', { method: 'PUT', body });

export const getPublicProfile = (id: string, signal?: AbortSignal) =>
  api<PublicProfile>(`/users/${encodeURIComponent(id)}`, { signal });
