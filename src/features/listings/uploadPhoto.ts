import { buildUrl } from '../../lib/api/client';
import { toListingPhoto } from '../../lib/image';
import { readToken } from '../../lib/token';

/** Mengecilkan foto, lalu mengunggahnya langsung ke Vercel Blob dengan izin dari backend. */
export async function uploadPhoto(file: Blob, userId: string) {
  const photo = await toListingPhoto(file);
  // Diunduh hanya saat pengguna benar-benar mengunggah.
  const { upload } = await import('@vercel/blob/client');
  try {
    const blob = await upload(`listings/${userId}/foto.jpg`, photo, {
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
