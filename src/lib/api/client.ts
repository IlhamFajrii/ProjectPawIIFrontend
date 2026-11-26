import { readToken } from '../token';

export interface FieldError {
  field: string;
  message: string;
}

/** `status` 0 berarti server tidak terjangkau. */
export class ApiError extends Error {
  readonly status: number;
  readonly errors: FieldError[];

  constructor(status: number, message: string, errors: FieldError[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

const NETWORK_MESSAGE = 'Tidak bisa terhubung ke server. Periksa koneksi, lalu coba lagi.';

function fallbackMessage(status: number): string {
  if (status === 401) return 'Sesi kamu berakhir. Masuk lagi untuk melanjutkan.';
  if (status === 403) return 'Kamu tidak berhak melakukan ini.';
  if (status === 404) return 'Data tidak ditemukan.';
  if (status === 413) return 'Ukuran data terlalu besar.';
  return 'Server sedang bermasalah. Coba lagi sebentar lagi.';
}

type UnauthorizedHandler = (token: string | null) => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

export type QueryParams = Record<string, string | number | undefined>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: QueryParams;
  signal?: AbortSignal;
}

export function buildUrl(path: string, query: QueryParams = {}): string {
  // Backend menolak parameter berulang, jadi setiap nama hanya diisi sekali.
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(name, String(value));
  }
  const search = params.toString();
  const base = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '');
  return `${base}/api${path}${search ? `?${search}` : ''}`;
}

interface Envelope {
  success?: boolean;
  data?: unknown;
  message?: string;
  errors?: FieldError[];
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal } = options;
  const token = readToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(0, NETWORK_MESSAGE);
  }

  const payload = (await response.json().catch(() => null)) as Envelope | null;
  if (response.ok && payload?.success) return payload.data as T;

  // 401 dari /auth/login berarti password salah, bukan sesi yang berakhir.
  if (response.status === 401 && path !== '/auth/login') onUnauthorized?.(token);

  const status = response.ok ? 502 : response.status;
  throw new ApiError(status, payload?.message || fallbackMessage(status), payload?.errors ?? []);
}
