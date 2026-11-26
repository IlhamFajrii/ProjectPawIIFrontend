import { api } from './client';
import type { AiDraft } from './types';

export type AiImageType = 'image/jpeg' | 'image/png' | 'image/webp';

export const draftListing = (body: { imageBase64: string; mimeType: AiImageType; note?: string }) =>
  api<AiDraft>('/ai/draft-listing', { method: 'POST', body });
