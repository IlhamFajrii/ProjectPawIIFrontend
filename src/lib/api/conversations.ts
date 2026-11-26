import { api } from './client';
import { findAcrossPages, MAX_LIMIT } from './pages';
import type { Conversation, Message, Paginated } from './types';

const messagesPath = (id: string) => `/conversations/${encodeURIComponent(id)}/messages`;

/** Mengembalikan percakapan lama (200) atau membuat yang baru (201). */
export const startConversation = (listingId: string) =>
  api<Conversation>('/conversations', { method: 'POST', body: { listingId } });

export const getConversations = (page: number, limit = 20, signal?: AbortSignal) =>
  api<Paginated<Conversation>>('/conversations', { query: { page, limit }, signal });

export const findConversation = (id: string, signal?: AbortSignal) =>
  findAcrossPages(
    (page) => getConversations(page, MAX_LIMIT, signal),
    (conversation) => conversation._id === id,
  );

/** Memanggil endpoint ini menandai pesan lawan sebagai dibaca. Jangan di-prefetch. */
export const getMessages = (id: string, after?: string, signal?: AbortSignal) =>
  api<Message[]>(messagesPath(id), { query: { after }, signal });

export const sendMessage = (id: string, text: string) =>
  api<Message>(messagesPath(id), { method: 'POST', body: { text } });
