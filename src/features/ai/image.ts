import type { AiImageType } from '../../lib/api/ai';

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_SIDES = [2048, 1600, 1280, 1024, 768];
const QUALITY = 0.85;

/** Tipe dibaca dari isi file, karena server mencocokkan isi dengan `mimeType`. */
export function sniffImageType(bytes: Uint8Array): AiImageType | null {
  const starts = (signature: number[], offset = 0) =>
    signature.every((byte, index) => bytes[offset + index] === byte);
  if (starts([0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  // "RIFF" .... "WEBP"
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp';
  return null;
}

/** Mengecilkan sisi terpanjang menjadi `maxSide`, tanpa memperbesar. */
export function scaleDown(width: number, height: number, maxSide: number) {
  const ratio = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}

/** Mencoba ukuran yang makin kecil sampai hasilnya muat. */
export async function shrinkToLimit<T extends { size: number }>(
  render: (maxSide: number, quality: number) => Promise<T>,
  limit = MAX_IMAGE_BYTES,
): Promise<T | null> {
  for (const side of MAX_SIDES) {
    const result = await render(side, QUALITY);
    if (result.size <= limit) return result;
  }
  return null;
}

async function renderJpeg(bitmap: ImageBitmap, maxSide: number, quality: number) {
  const canvas = document.createElement('canvas');
  const { width, height } = scaleDown(bitmap.width, bitmap.height, maxSide);
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Browser tidak bisa memproses foto ini.');
  // Bagian transparan menjadi putih, karena JPEG tidak punya transparansi.
  context.fillStyle = 'white';
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Foto gagal diperkecil.'))),
      'image/jpeg',
      quality,
    ),
  );
}

const toBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    // Awalan "data:...;base64," dibuang.
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('Foto gagal dibaca.'));
    reader.readAsDataURL(blob);
  });

/** Menyiapkan foto untuk AI draft: maksimal 3 MB, base64 tanpa awalan data URL. */
export async function prepareImage(file: Blob) {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const mimeType = sniffImageType(head);
  if (!mimeType) throw new Error('Pilih foto JPEG, PNG, atau WebP.');
  if (file.size <= MAX_IMAGE_BYTES) return { imageBase64: await toBase64(file), mimeType, resized: false };

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('Foto ini tidak bisa dibuka. Coba foto lain.');
  });
  try {
    const blob = await shrinkToLimit((side, quality) => renderJpeg(bitmap, side, quality));
    if (!blob) throw new Error('Foto masih lebih dari 3 MB setelah diperkecil. Coba foto lain.');
    return { imageBase64: await toBase64(blob), mimeType: 'image/jpeg' as const, resized: true };
  } finally {
    bitmap.close();
  }
}
