import type { Message } from '../../lib/api/types';

export const PAGE_SIZE = 50;
export const OVERLAP_MS = 5000;
const MAX_ROUNDS = 20;

const byTime = (a: Message, b: Message) =>
  Date.parse(a.createdAt) - Date.parse(b.createdAt) || a._id.localeCompare(b._id);

/** Menggabungkan tanpa duplikat (berdasarkan `_id`) dan mengurutkan menurut waktu. */
export function mergeMessages(current: Message[], incoming: Message[]): Message[] {
  const known = new Map(current.map((message) => [message._id, message]));
  const fresh = incoming.filter((message) => !known.has(message._id));
  // Referensi lama dipertahankan agar tampilan tidak bergerak saat tidak ada yang baru.
  if (fresh.length === 0) return current;
  for (const message of fresh) known.set(message._id, message);
  return [...known.values()].sort(byTime);
}

/** Waktu pesan terakhir dikurangi 5 detik, agar pesan yang tersimpan bersamaan tidak terlewat. */
export function nextAfter(messages: Message[]): string | undefined {
  const last = messages.at(-1);
  return last ? new Date(Date.parse(last.createdAt) - OVERLAP_MS).toISOString() : undefined;
}

/** Satu putaran polling: ambil lagi selama server mengembalikan halaman penuh. */
export async function pollMessages(
  current: Message[],
  load: (after?: string) => Promise<Message[]>,
): Promise<Message[]> {
  let after = nextAfter(current);
  if (after === undefined) return mergeMessages(current, await load());

  let result = current;
  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const incoming = await load(after);
    result = mergeMessages(result, incoming);
    const last = incoming.at(-1);
    // Lanjutan memakai waktu pesan terakhir apa adanya agar selalu maju.
    if (incoming.length < PAGE_SIZE || !last || last.createdAt === after) break;
    after = last.createdAt;
  }
  return result;
}
