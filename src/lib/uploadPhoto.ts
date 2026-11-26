import { buildUrl } from './api/client';
import { toUploadPhoto } from './image';
import { readToken } from './token';

export type PhotoKind = 'listings' | 'avatars' | 'evidence';

/** Mengecilkan foto, lalu mengunggahnya langsung ke Vercel Blob dengan izin dari backend. */
export async function uploadPhoto(file: Blob, userId: string, kind: PhotoKind = 'listings') {
  // Foto profil hanya tampil kecil.
  const photo = await toUploadPhoto(file, kind === 'avatars' ? 512 : undefined);
  // Diunduh hanya saat pengguna benar-benar mengunggah.
  const { upload } = await import('@vercel/blob/client');
  try {
    const blob = await upload(`${kind}/${userId}/foto.jpg`, photo, {
      access: 'public',
      contentType: 'image/jpeg',
      handleUploadUrl: buildUrl('/uploads'),
      headers: { Authorization: `Bearer ${readToken() ?? ''}` },
    });
    return blob.url;
  } catch {
    throw new Error('Foto gagal diunggah. Periksa koneksi atau masuk ulang, lalu coba lagi.');
  }
}
