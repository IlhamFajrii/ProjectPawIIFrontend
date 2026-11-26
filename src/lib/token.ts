// Token disimpan di localStorage karena backend hanya mendukung Bearer token (PRD bagian 11).
// Cadangan di memori hanya dipakai bila storage diblokir.
export const TOKEN_KEY = 'punya.token';
let fallback: string | null = null;

export function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeToken(token: string | null) {
  fallback = null;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage diblokir: sesi hanya bertahan selama halaman terbuka.
    fallback = token;
  }
}
