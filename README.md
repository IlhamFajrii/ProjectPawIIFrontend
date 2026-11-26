# PUNYA Web

Frontend PUNYA, marketplace lokal Palembang untuk barang, sewa, jasa, dan tugas bantuan. Pembayaran memakai Rekber simulasi: dana ditandai ditahan sampai pembeli mengonfirmasi, dan tidak ada uang sungguhan yang berpindah.

| Layanan | Alamat |
|---|---|
| Aplikasi web | https://project-paw-ii-frontend.vercel.app |
| Status API | https://project-paw-ii-backend.vercel.app/api/health |

## Fitur

- Jelajah listing dengan pencarian dan filter tipe, kecamatan, kategori, serta harga.
- Pasang dan ubah listing, dengan unggah foto dari galeri atau kamera.
- Pesanan dengan tahap Rekber, riwayat status, dan pengajuan sengketa.
- Chat antara pengguna.
- Circle untuk kelompok yang saling kenal, dengan vouch antaranggota.
- Draft listing dari foto dengan bantuan AI.
- Profil dengan foto profil, serta tema terang dan gelap.

## Teknologi

React 19, TypeScript, Vite, Tailwind CSS 4, React Router 8, TanStack Query, React Hook Form, Zod, GSAP, three.js, dan Vercel Blob. Data berasal dari REST API PUNYA Backend.

## Menjalankan di lokal

Butuh Node.js 22.22 atau lebih baru (teruji dengan 24).

1. Jalankan backend di terminal terpisah. Ikuti README backend; setelah siap, `http://localhost:3000/api/health` menjawab `ok`.

   ```bash
   cd ../ProjectPawIIBackend
   npm install
   npm run dev
   ```

2. Pasang dan jalankan frontend.

   ```bash
   npm install
   cp .env.example .env      # PowerShell: Copy-Item .env.example .env
   npm run dev               # http://localhost:5173
   ```

Saat development, request `/api` diteruskan Vite ke `VITE_PROXY_TARGET`. Proxy ini perlu karena CORS backend production belum mengizinkan `localhost:5173`. Unggah foto membutuhkan `BLOB_READ_WRITE_TOKEN` di backend yang dituju.

> Periksa tujuan `VITE_PROXY_TARGET` dan `MONGODB_URI` backend. Mendaftar, memesan, chat, dan unggah foto menulis data ke database dan penyimpanan yang ditunjuk di sana.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server development di port 5173 |
| `npm run typecheck` | Pemeriksaan tipe TypeScript |
| `npm run lint` | ESLint |
| `npm run test` | Vitest sekali jalan |
| `npm run build` | Pemeriksaan tipe lalu build production ke `dist/` |
| `npm run preview` | Menyajikan `dist/` di port 4173 dengan header dari `vercel.json` |

## Variabel

Semua variabel `VITE_*` ikut masuk ke bundle dan bisa dibaca siapa pun. Jangan menaruh secret di sini.

| Variabel | Wajib | Keterangan |
|---|---|---|
| `VITE_API_URL` | tidak | Origin backend tanpa `/api`, bila browser harus memanggil backend langsung. Biarkan kosong: `/api` diteruskan oleh Vite (lokal) atau rewrite `vercel.json` (Vercel) |
| `VITE_PROXY_TARGET` | tidak | Tujuan proxy development dan preview. Default `http://localhost:3000` |

## Struktur

```
ProjectPawIIFrontend/
  public/             favicon
  src/
    app/              router, layout, penjaga rute, sesi, halaman pratinjau (dev)
    lib/
      api/            client.ts (satu-satunya pemanggil fetch), types.ts, satu modul per sumber data
      constants.ts    enum, label, dan kecamatan (salinan dari backend)
      format.ts       rupiah dan tanggal
      image.ts        pengecil foto sebelum dikirim
      uploadPhoto.ts  unggah foto ke Vercel Blob
      orderActions.ts aksi sah per status dan peran
    features/         ai, auth, chat, circles, disputes, landing, listings, orders, profile
    components/
      ui/             Button, Field, Dialog, Menu, Toast, Skeleton, state data
      layout/         TopNav, TabBar, ThemeToggle
      listing/        kartu dan foto listing
      order/          kartu, status, dan timeline pesanan
    styles/index.css  token warna dan tipografi, tema, gerak
    test/             setup dan pemeriksaan aturan proyek
  index.html          skrip tema yang berjalan sebelum render
  vercel.json         rewrite API dan SPA, header keamanan
  vite.config.ts
```

Fitur tidak saling mengimpor isinya (dijaga ESLint). Yang dipakai dua fitur ditaruh di `components/` atau `lib/`, dan perakitan lintas fitur dilakukan di `app/`.

Pratinjau semua komponen ada di `http://localhost:5173/_pratinjau` (hanya saat development).

## Unggah foto

Foto listing (maksimal 8 per listing) dan foto profil dipilih dari perangkat. Browser menggambar ulang setiap foto menjadi JPEG maksimal 3 MB sehingga data EXIF, termasuk lokasi, ikut terbuang. Sisi terpanjang foto listing dibatasi 2048 piksel dan foto profil 512 piksel.

Setelah mendapat izin sekali pakai dari `POST /api/uploads`, browser mengirim foto langsung ke Vercel Blob. Database hanya menyimpan URL-nya. Pengguna juga bisa menempel URL `https` secara manual.

## Animasi

Pembuka dan cerita Rekber di beranda berjalan di atas satu scene jembatan bergaya Ampera (`src/features/landing/scene.ts`). Scroll menggerakkan kamera, mengangkat bentang tengah selama dana contoh ditahan, dan menyambungkannya lagi setelah dikonfirmasi, sementara langit berubah dari senja ke pagi. Di layar dengan mouse, kamera ikut bergeser halus.

Di bagian lain beranda, satu kalimat menyala kata demi kata dan nama tipe melebar saat digulir, disertai parallax GSAP ringan serta peragaan AI. Di dalam aplikasi ada penanda nav yang meluncur saat berpindah halaman, daftar yang masuk bergiliran, perayaan singkat saat dana ditahan atau pesanan selesai, dan pergantian tema melingkar.

Saat perangkat meminta gerak dikurangi, scene hanya berganti gambar per tahap tanpa animasi. Tanpa WebGL, latar gradasi tampil dan seluruh teks tetap terbaca. Sebagian gerak scroll memakai CSS `animation-timeline`; browser tanpa dukungan menampilkan halaman utuh tanpa gerak tersebut.

## Deploy ke Vercel

Production di-deploy otomatis dari branch `main`. `vercel.json` meneruskan `/api/*` ke https://project-paw-ii-backend.vercel.app, jadi tidak perlu environment variable dan CORS backend tidak perlu diubah.

Untuk project baru:

1. Import repository ke Vercel dengan preset Vite, atau jalankan `npx vercel --prod` dari folder ini.
2. Jangan isi `VITE_API_URL` di dashboard Vercel.
3. Kalau URL backend berganti, ubah rewrite `/api` di `vercel.json`.
4. Periksa bahwa `/api/health` di domain frontend menjawab `ok`, dan memuat ulang rute dalam (misalnya `/jelajah`) tidak menghasilkan 404.

Kalau skrip di `index.html` diubah, perbarui hash `sha256-` di `vercel.json`. `npm run test` akan gagal bila keduanya tidak cocok.

## Performa

> Angka di bagian ini diukur sebelum beranda didesain ulang dengan scene 3D dan belum diukur ulang. Potongan JavaScript scene (three.js) sekitar 140 kB gzip dan diunduh saat beranda dibuka.

Diukur 26 November 2026 pada build production lewat `npm run preview` di komputer development, dengan Lighthouse mode ponsel (jaringan dan CPU disimulasikan), median dari 3 kali jalan. Angka di hosting sungguhan bisa berbeda.

| Halaman | Skor performa | LCP (target < 2,5 dtk) | CLS (target < 0,1) | TBT | JavaScript terunduh (target ≤ 180 kB gzip) |
|---|---|---|---|---|---|
| `/` | 99 | 0,76 dtk | 0 | 121 ms | 156,4 kB |
| `/jelajah` | 100 | 0,76 dtk | 0 | 15 ms | 150,8 kB |
| `/listing/:id` | 97 | 2,54 dtk (tidak stabil) | 0 | 29 ms | 148,2 kB |
| `/masuk` | 100 | 0,76 dtk | 0 | 20 ms | 177,0 kB |

LCP detail listing berpindah antara sekitar 0,8 dan 2,6 dtk dari satu pengukuran ke pengukuran lain.

INP tidak bisa diukur Lighthouse. Pendekatan dengan klik pada CPU 4x lebih lambat, diukur 25 November sebelum efek gerak ditambahkan, menunjukkan bahwa membuka filter di layar sempit (344 sampai 360 ms) melampaui target 200 ms.

Gerak beranda pada CPU 4x lebih lambat, digulir dari atas ke bawah sambil menggerakkan pointer: waktu antar-frame persentil 95 30 ms di 1440px dan 18 ms di 390px, tanpa long task, dengan satu atau dua frame di atas 50 ms.

### Setelah parallax ditambahkan

Pengukuran ini dilakukan di komputer yang sama saat sedang lebih sibuk, sehingga angkanya tidak sebanding dengan tabel di atas. Karena itu versi sebelum dan sesudah parallax diukur berurutan. Lighthouse mode ponsel pada `/`, median 3 kali:

| Versi | Skor performa | LCP | CLS | TBT | JavaScript saat muat |
|---|---|---|---|---|---|
| Sebelum parallax | 90 | 0,77 dtk | 0 | 405 ms | 156,4 kB |
| Sesudah parallax | 88 | 0,77 dtk | 0 | 464 ms | 160,0 kB |

- GSAP untuk parallax (sekitar 45 kB gzip) baru diunduh saat halaman digulir. Di layar di bawah 1024px, total JavaScript beranda setelah digulir menjadi sekitar 205 kB, di atas angka 180 kB untuk muatan awal.
- Menggulir seluruh beranda tanpa pembatasan CPU: persentil 95 waktu antar-frame sama untuk kedua versi (sekitar 18 sampai 24 ms di 1440px, 12 ms di 390px).
- Dengan CPU 4x lebih lambat: persentil 95 naik dari sekitar 85 ke 91 ms (1440px) dan dari 48 ke 55 sampai 61 ms (390px).
- Saat scroll pertama di CPU 4x, pemuatan parallax memakan tugas paling lama sekitar 150 ms.

## Keterbatasan

Berasal dari backend:

- Foto yang diganti atau dihapus tetap tersimpan di Vercel Blob. Jumlah unggahan per akun belum dibatasi.
- Listing yang dinonaktifkan tidak bisa diaktifkan lagi.
- Pesanan tidak menyimpan foto.
- Chat memakai polling, hanya menampilkan 50 pesan terbaru saat dibuka, tanpa tanda dibaca dan tanpa jumlah belum dibaca.
- Tidak ada daftar kategori, opsi urutan, atau daftar listing per pengguna.
- Logout hanya di sisi klien; token tetap berlaku sampai kedaluwarsa.
- Draft AI membutuhkan `GEMINI_API_KEY` di backend, yang belum diisi di production.

Di frontend:

- Token disimpan di `localStorage` karena backend hanya mendukung Bearer token. Mitigasinya CSP ketat, tanpa `dangerouslySetInnerHTML`, dan dependency yang sedikit.
- Foto yang diunggah bisa dilihat siapa saja yang memiliki URL-nya. Untuk URL yang ditempel manual, host foto bisa melihat alamat IP pengunjung.
- Teks UI hanya Bahasa Indonesia. Pesan dari server memakai sapaan "Anda".
- Posisi baca di ruang chat dijaga oleh *scroll anchoring* bawaan browser. Di browser yang tidak mendukungnya, posisi bisa bergeser saat pesan lama tersusul.

## Belum diuji

- Jalur sukses draft AI dengan Gemini sungguhan (alur tinjau dan pakai draft hanya diuji dengan respons tiruan).
- Pembaca layar.
- Google Chrome, Safari, dan Firefox asli di perangkat. Pengujian utama memakai Microsoft Edge (Chromium). Firefox dan WebKit bawaan Playwright hanya diuji untuk popup, menu, tema, dan cerita Rekber versi sebelum beranda didesain ulang.
- Perangkat sentuh sungguhan, termasuk kelancaran gerak di ponsel kelas bawah dan pemilihan foto dari galeri.
- Alur yang menulis data di backend production. Pengujian alur memakai backend lokal dengan database uji.
