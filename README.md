# PUNYA Web

Frontend PUNYA, marketplace lokal Palembang untuk barang, sewa, jasa, dan tugas bantuan, dengan **Rekber simulasi**: dana ditandai ditahan sampai pembeli mengonfirmasi. Tidak ada uang sungguhan yang berpindah.

Dibuat dengan React 19, TypeScript, Tailwind CSS 4, React Router 8, TanStack Query, GSAP, dan three.js. Datanya dari REST API [PUNYA Backend](https://project-paw-ii-backend.vercel.app/api/health).

## Gerak

- **Jembatan 3D (three.js):** pembuka dan cerita Rekber berjalan di atas satu scene jembatan bergaya Ampera. Scroll menggerakkan kamera, mengangkat bentang tengah selama dana contoh ditahan, dan menyambungkannya lagi setelah dikonfirmasi, sementara langit berubah dari senja ke pagi. Di layar dengan mouse, kamera ikut bergeser halus. Kodenya di `src/features/landing/scene.ts`.
- **Bagian lain beranda:** satu kalimat menyala kata demi kata, nama tipe melebar saat digulir, parallax GSAP ringan, dan peragaan AI.
- **Aplikasi:** perpindahan halaman dengan penanda nav yang meluncur, daftar masuk bergiliran, perayaan singkat saat dana ditahan atau pesanan selesai, dan ganti tema melingkar.
- Saat perangkat meminta gerak dikurangi, scene hanya berganti gambar per tahap tanpa animasi. Tanpa WebGL, latar gradasi tampil dan seluruh teks tetap terbaca. Sebagian gerak scroll memakai CSS `animation-timeline`; browser tanpa dukungan menampilkan halaman utuh tanpa gerak tersebut.

## Menjalankan dari nol

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

Saat development, request `/api` diteruskan Vite ke `VITE_PROXY_TARGET`. Proxy ini perlu karena CORS backend production belum mengizinkan `localhost:5173`.

> Periksa dulu `MONGODB_URI` di `.env` backend. Mendaftar, memesan, dan chat menulis data ke database yang ditunjuk di sana.

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

## Deploy ke Vercel

Belum pernah dilakukan dari repository ini.

`vercel.json` meneruskan `/api/*` ke https://project-paw-ii-backend.vercel.app, jadi tidak perlu environment variable dan CORS backend tidak perlu diubah.

1. Jalankan `npx vercel --prod` dari folder ini (pertama kali akan diminta login dan membuat project), atau import repository ke Vercel dengan preset Vite.
2. Jangan isi `VITE_API_URL` di dashboard Vercel.
3. Kalau URL backend berganti, ubah rewrite `/api` di `vercel.json`.
4. Periksa: `/api/health` di domain frontend menjawab `ok`, dan muat ulang rute dalam (misalnya `/jelajah`) tidak 404.

Kalau skrip di `index.html` diubah, perbarui hash `sha256-` di `vercel.json`. `npm run test` akan gagal bila keduanya tidak cocok.

## Performa

> Angka di bagian ini diukur **sebelum** beranda didesain ulang dengan scene 3D dan belum diukur ulang. Potongan JavaScript scene (three.js) sekitar 140 kB gzip dan diunduh saat beranda dibuka.

Diukur 26 November 2026 pada build production lewat `npm run preview` di komputer development, dengan Lighthouse mode ponsel (jaringan dan CPU disimulasikan), median dari 3 kali jalan. Angka di hosting sungguhan bisa berbeda.

| Halaman | Skor performa | LCP (target < 2,5 dtk) | CLS (target < 0,1) | TBT | JavaScript terunduh (target ≤ 180 kB gzip) |
|---|---|---|---|---|---|
| `/` | 99 | 0,76 dtk | 0 | 121 ms | 156,4 kB |
| `/jelajah` | 100 | 0,76 dtk | 0 | 15 ms | 150,8 kB |
| `/listing/:id` | 97 | **2,54 dtk (tidak stabil, lihat bawah)** | 0 | 29 ms | 148,2 kB |
| `/masuk` | 100 | 0,76 dtk | 0 | 20 ms | 177,0 kB |

LCP detail listing tidak stabil: antar-jalan berpindah antara sekitar 0,8 dan 2,6 dtk.

INP tidak bisa diukur Lighthouse. Pendekatan dengan klik pada CPU 4x lebih lambat, diukur 25 November sebelum efek gerak ditambahkan: **membuka filter di layar sempit (344 sampai 360 ms) di atas target 200 ms**.

Gerak beranda pada CPU 4x lebih lambat, digulir dari atas ke bawah sambil menggerakkan pointer: waktu antar-frame persentil 95 30 ms di 1440px dan 18 ms di 390px, tanpa long task, dengan satu atau dua frame di atas 50 ms.

### Setelah parallax ditambahkan

Diukur di komputer yang sama saat sedang lebih sibuk, sehingga angkanya tidak sebanding dengan tabel di atas. Karena itu versi sebelum dan sesudah parallax diukur berurutan. Lighthouse mode ponsel pada `/`, median 3 kali:

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

- Foto diunggah langsung dari browser ke Vercel Blob (publik), atau ditempel sebagai URL `https`. Foto yang dihapus dari listing tidak otomatis terhapus dari Blob. Host foto bisa melihat alamat IP pengunjung.
- Listing yang dinonaktifkan tidak bisa diaktifkan lagi.
- Pesanan tidak menyimpan foto.
- Chat memakai polling, hanya menampilkan 50 pesan terbaru saat dibuka, tanpa tanda dibaca dan tanpa jumlah belum dibaca.
- Tidak ada daftar kategori, opsi urutan, atau daftar listing per pengguna.
- Logout hanya di sisi klien; token tetap berlaku sampai kedaluwarsa.
- AI draft butuh `GEMINI_API_KEY` di backend.

Di frontend:

- Token disimpan di `localStorage` karena backend hanya mendukung Bearer token. Mitigasinya: CSP ketat, tanpa `dangerouslySetInnerHTML`, dependency sedikit.
- Teks UI hanya Bahasa Indonesia. Pesan dari server memakai sapaan "Anda".
- Posisi baca di ruang chat dijaga oleh *scroll anchoring* bawaan browser. Di browser yang tidak mendukungnya, posisi bisa bergeser saat pesan lama tersusul.

## Belum diuji

- Jalur sukses AI draft dengan Gemini sungguhan (alur tinjau dan pakai draft hanya diuji dengan respons tiruan).
- Pembaca layar.
- Google Chrome, Safari, dan Firefox asli di perangkat. Pengujian utama memakai Microsoft Edge (Chromium). Firefox dan WebKit bawaan Playwright hanya diuji untuk popup, menu, tema, dan cerita Rekber.
- Perangkat sentuh sungguhan, termasuk kelancaran gerak di ponsel kelas bawah.
- Backend production: semua pengujian alur memakai backend lokal dengan database sementara.

## Dependency tambahan

Di luar pustaka utama, hanya perkakas development: ESLint (dengan plugin TypeScript dan React), `@vitejs/plugin-react`, `jsdom`, dan paket tipe. Resolver Zod untuk React Hook Form ditulis sendiri di `src/lib/zodResolver.ts`.
