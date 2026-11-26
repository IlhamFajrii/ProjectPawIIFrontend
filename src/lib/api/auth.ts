import { api } from './client';
import type { User } from './types';

export interface RegisterInput {
  name: string;
  phone: string;
  email?: string;
  password: string;
  district: string;
}

export const register = (body: RegisterInput) => api<User>('/auth/register', { method: 'POST', body });

export const login = (body: { identifier: string; password: string }) =>
  api<{ token: string; user: User }>('/auth/login', { method: 'POST', body });

export const getMe = (signal?: AbortSignal) => api<User>('/auth/me', { signal });
