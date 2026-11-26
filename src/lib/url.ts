/** URL dari pengguna hanya dipakai bila berawalan http atau https. */
export function safeUrl(value: string | undefined | null): string | undefined {
  if (!value || !/^https?:\/\/\S+$/i.test(value)) return undefined;
  return value;
}

/** Tujuan setelah masuk hanya boleh path di dalam aplikasi. */
export function safeNextPath(value: string | null | undefined): string {
  // Backslash dan karakter kontrol dibaca browser sebagai pemisah, jadi ditolak.
  // eslint-disable-next-line no-control-regex
  if (!value || !/^\/(?!\/)[^\\\u0000-\u001f]*$/.test(value)) return '/';
  return value;
}

export const idOf = (value: string | { _id: string }) => (typeof value === 'string' ? value : value._id);

export function objectOf<T extends { _id: string }>(value: string | T | undefined): T | undefined {
  return typeof value === 'object' ? value : undefined;
}
