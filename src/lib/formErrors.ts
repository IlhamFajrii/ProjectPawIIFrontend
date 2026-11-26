import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';
import { ApiError } from './api/client';

export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : 'Terjadi kesalahan. Coba lagi.';

/** `images.0` dari server menjadi `images.0.url` di form. */
export const toFormPath = (field: string) => field.replace(/^(images|evidence)\.(\d+)$/, '$1.$2.url');

/**
 * Memasang `errors[].field` dari server ke field form.
 * `guess` dipakai untuk pesan server tanpa daftar field, misalnya "Email sudah terdaftar".
 * Mengembalikan pesan umum untuk ditampilkan di ringkasan.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly string[],
  guess?: (message: string) => FieldPath<T> | undefined,
): string {
  if (!(error instanceof ApiError)) return errorMessage(error);

  for (const item of error.errors) {
    const path = toFormPath(item.field);
    if (fields.includes(path.split('.')[0] ?? '')) {
      setError(path as FieldPath<T>, { type: 'server', message: capitalize(item.message) });
    }
  }
  const guessed = error.errors.length === 0 ? guess?.(error.message) : undefined;
  if (guessed) setError(guessed, { type: 'server', message: error.message });
  return error.message;
}

export interface FlatError {
  name: string;
  message: string;
}

export function flattenErrors(errors: object, prefix = ''): FlatError[] {
  return Object.entries(errors).flatMap(([key, value]: [string, unknown]) => {
    if (!value || typeof value !== 'object') return [];
    const name = prefix ? `${prefix}.${key}` : key;
    const message = (value as { message?: unknown }).message;
    if (typeof message === 'string') return [{ name, message }];
    return flattenErrors(value, name);
  });
}
