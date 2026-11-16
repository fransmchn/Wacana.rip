# PRD: Wacana.rip — Digital Graveyard

**Versi:** 1.0 (MVP) · **Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons, Framer Motion · **Penyimpanan MVP:** localStorage

## 1. Ringkasan Produk

**Wacana.rip** adalah pemakaman digital tempat siapa saja menguburkan ide, tugas, atau proyek yang gagal atau ditinggalkan secara estetik dan humoris: judul skripsi yang ditolak, repo yang mangkrak, desain yang nggak kelar, bisnis wacana, sampai resolusi tahun baru.

**Tagline:** *"Tempat peristirahatan terakhir bagi judul skripsi yang ditolak, repo yang mangkrak, dan wacana yang tak pernah terjadi."*

**Nama area di UI:** "TPU Wacana" (plesetan Tempat Pemakaman Umum), dipakai sebagai nama area/label section.

## 2. Tujuan dan Non-Tujuan

### Tujuan

- Memberi ruang yang lucu, relatable, dan aman untuk "melepaskan" proyek gagal.
- Pengalaman visual yang kuat: cozy dark gothic, interaktif, enak di-screenshot.
- Arsitektur data yang siap pindah dari localStorage ke Supabase tanpa menulis ulang UI.
- Konten yang shareable lewat Sertifikat Kematian.

### Non-Tujuan (MVP)

- Tidak ada autentikasi, akun, atau profil pengguna.
- Tidak ada sinkronisasi antar pengunjung. Data hanya tersimpan di browser masing-masing. Jangan bikin fitur sinkronisasi palsu.
- Tidak ada moderasi server, notifikasi, atau pembayaran.
- Tidak ada multi-bahasa (UI Bahasa Indonesia saja).

## 3. Target Pengguna

| Persona | Contoh wacana |
| --- | --- |
| Mahasiswa | Ganti judul skripsi untuk ketiga kalinya |
| Programmer | Repo "side project" yang berhenti di commit ke-4 |
| Kreator / desainer | Logo atau brand yang nggak pernah rilis |
| Pebisnis wacana | Startup yang berhenti di tahap beli domain |
| Umum | Resolusi gym, belajar bahasa baru, dll. |

## 4. Konsep Kunci dan Catatan Penting

1. **Statistik "kolektif"** di MVP hanya mencerminkan data lokal pengunjung + seed data. Sebutkan ini sebagai komentar kode dan catatan di README. Saat pindah ke Supabase, statistik jadi benar-benar kolektif.
2. **Kerugian dipecah jadi data terstruktur** agar bisa dijumlahkan: `kerugianRupiah` (angka, opsional), `kerugianJam` (angka, opsional), dan `kerugianTeks` (cerita bebas).
3. **Service async dari awal.** Semua fungsi di `graveyardService.ts` mengembalikan `Promise`, supaya migrasi ke Supabase cukup mengganti isi fungsi.
4. **Hydration-safe.** Semua akses localStorage dilakukan setelah mount di client component (`"use client"`), tanpa menyebabkan hydration mismatch.

## 5. Model Data

```ts
type Kategori = "skripsi" | "koding" | "desain" | "bisnis" | "resolusi";
type TipeNisan = "kayu" | "granit" | "marmer";

interface Komentar {
  id: string;
  nama: string;        // default "Anonim", maks 30 karakter
  isi: string;         // maks 280 karakter, render sebagai teks biasa
  createdAt: string;   // ISO
}

interface Makam {
  id: string;
  judul: string;            // maks 120 karakter
  kategori: Kategori;
  pembuat: string;          // "Anonim" jika kosong
  tanggalMulai: string;     // ISO date
  tanggalMenyerah: string;  // ISO date, >= tanggalMulai, <= hari ini
  penyebab: string;
  epitaph: string;          // maks 140 karakter
  kronologi: string;        // cerita lengkap, maks 1000 karakter
  kerugianTeks: string;
  kerugianRupiah?: number;
  kerugianJam?: number;
  bunga: number;
  lilin: boolean;           // status nyala untuk pengunjung ini
  komentar: Komentar[];
  createdAt: string;
}
```

`TipeNisan` dan durasi hidup **diturunkan** dari tanggal (tidak disimpan).

### Aturan tipe nisan (berdasarkan durasi hidup)

| Tipe | Durasi |
| --- | --- |
| Kayu | < 3 hari |
| Granit | 3 hari sampai 90 hari |
| Marmer Retak | > 90 hari |

Durasi 0 hari ditampilkan sebagai "kurang dari sehari".

## 6. Layer Service (`src/lib/graveyardService.ts`)

Semua fungsi async. Kunci localStorage ber-prefix dan versi, misalnya `wacana-rip:v1`.

- `listMakam(): Promise<Makam[]>` — seed otomatis saat storage kosong.
- `getMakam(id): Promise<Makam | null>`
- `createMakam(input): Promise<Makam>` — validasi dan sanitasi di sini.
- `taburBunga(id): Promise<Makam>` — menambah counter.
- `toggleLilin(id): Promise<Makam>`
- `tambahKomentar(id, input): Promise<Makam>` — validasi panjang dan trim.
- `getStatistik(): Promise<Statistik>` — total makam, total bunga, total rupiah, total jam.

Hook `useGraveyard()` membungkus service: state, loading, error, dan aksi. Komponen UI **tidak boleh** mengakses localStorage langsung. Jika localStorage tidak tersedia atau data korup, fallback ke seed data tanpa crash.

## 7. Seed Data (8 makam)

Minimal satu per kategori, tanggal relatif terhadap hari ini supaya ketiga tipe nisan terwakili (kayu, granit, marmer). Contoh ide:

1. **Skripsi:** "Analisis Sentimen Twitter" gugur karena dosen pembimbing susah ditemui. Epitaph: *"Revisi terakhir, harap dimaklumi."*
2. **Skripsi:** Ganti judul ke-4 sehari sebelum seminar proposal.
3. **Koding:** "Aplikasi to-do list super canggih", repo berhenti di commit ke-4, 11 nama folder `final_v2_beneran`.
4. **Koding:** "Rewrite semuanya pakai framework baru" — AI agent ngarang sendiri.
5. **Desain:** Redesign logo yang nggak pernah jadi, file terakhir bernama `logo_fix_final_FIX.psd`.
6. **Bisnis:** "Startup marketplace" mati setelah beli domain Rp 150rb.
7. **Bisnis:** Usaha kopi kekinian yang berhenti di tahap bikin logo.
8. **Resolusi:** "Gym tiap hari 2026", semangat cuma di hari pertama.

Setiap seed punya epitaph, kronologi singkat, kerugian teks, serta nilai `kerugianRupiah` dan `kerugianJam` yang wajar, beberapa bunga awal, dan 1 sampai 2 komentar.

## 8. Spesifikasi Fitur

### 8.1 Atmosfer dan Layout Utama

- Background `#09090b` ke `#121217` (gradient), kabut halus bergerak, dan partikel kunang-kunang.
- Header minimalis: logo **Wacana.rip**, tagline, CTA **"+ Kuburkan Wacana"** (sticky atau mudah dijangkau di mobile).
- **Banner Statistik:** Total Wacana Terkubur, Total Bunga Ditaburkan, Total Kerugian (Rp dan jam, dihitung dari field angka). Angka beranimasi count-up ringan.
- Kabut dan kunang-kunang memakai CSS animation atau canvas ringan. Jumlah partikel dikurangi di layar kecil (misal 8 di mobile, 20 di desktop). Hormati `prefers-reduced-motion`: animasi dimatikan atau disederhanakan.

### 8.2 Filter, Sort, dan Pencarian

- **Kategori:** Semua, 🎓 Skripsi & Riset, 💻 Koding & Tech, 🎨 Desain & Karya, 💼 Bisnis Wacana, 🏃 Resolusi & Hobi.
- **Urutkan:** Terbaru Gugur (tanggal menyerah desc), Paling Banyak Bunga, Umur Terpendek.
- **Search:** mencocokkan judul dan penyebab kematian, case-insensitive, dengan debounce kecil.
- Ketiganya bisa dikombinasikan. Jika hasil kosong, tampilkan empty state bertema (misal "Belum ada yang gugur di sini... untuk saat ini.") dengan CTA kuburkan wacana.

### 8.3 Grid Batu Nisan

- Kartu berbentuk siluet nisan (sisi atas melengkung, misal `border-radius` besar di atas atau clip-path).
- Tekstur/border sesuai tipe: **Kayu** (hangat, serat), **Granit** (abu gelap, berbintik), **Marmer Retak** (terang pucat dengan garis retak).
- Isi kartu: ikon kategori (Lucide atau emoji), judul, rentang tanggal (Lahir – Gugur) dan durasi hidup, badge penyebab kematian (merah gelap), kutipan epitaph.
- Tombol bawah:
  - **Tabur Bunga (🌷 + counter):** animasi kelopak jatuh/muncul (Framer Motion). Boleh diklik berkali-kali, tiap klik menambah 1. Animasi dibatasi jumlah kelopak per klik.
  - **Nyalakan Lilin (🕯️):** toggle, api berkedip pada nisan saat menyala. Status tersimpan.
- Klik area nisan (bukan tombol) membuka Modal Detail. Tombol memakai `stopPropagation`.
- Grid responsif: 1 kolom di mobile, 2 di tablet, 3 sampai 4 di desktop. Animasi masuk bertahap (stagger) dengan jumlah terbatas agar tetap ringan.

### 8.4 Modal Detail Makam

- Menampilkan judul, kategori, pembuat, rentang tanggal dan durasi, penyebab, epitaph, **kronologi kegagalan**, dan **kerugian** (teks dan angka terformat, misal "Rp 150.000 · 6 jam").
- Tombol bunga dan lilin tersedia juga di sini.
- **Tinggalkan Doa / Curhat Senasib:** form nama (opsional, default Anonim, maks 30 karakter) dan isi (wajib, maks 280 karakter, dengan counter karakter). Daftar komentar terbaru di atas.
- Semua teks user dirender sebagai teks biasa (tanpa `dangerouslySetInnerHTML`).
- Aksesibilitas: fokus terkunci di modal, tutup dengan Escape dan klik backdrop, `aria-modal`, dan label yang jelas.

### 8.5 Modal Ritual Pemakaman ("Kuburkan Wacana")

Field form:

| Field | Aturan |
| --- | --- |
| Nama wacana / judul | Wajib, maks 120 karakter |
| Kategori | Wajib, 5 pilihan |
| Nama pembuat | Opsional, default "Anonim" |
| Tanggal mulai | Wajib |
| Tanggal menyerah | Wajib, >= tanggal mulai dan <= hari ini; durasi hidup dihitung otomatis dan ditampilkan langsung |
| Penyebab kematian | Preset kocak atau ketik sendiri |
| Kata terakhir (epitaph) | Wajib, maks 140 karakter dengan counter |
| Kronologi singkat | Opsional, maks 1000 karakter |
| Kerugian | Teks bebas + angka Rupiah (opsional) + jam (opsional) |

Preset penyebab (contoh): *"Dosen pembimbing susah ditemui"*, *"AI agent ngarang sendiri"*, *"Semangat cuma di hari pertama"*, *"Scope creep tak terkendali"*, *"Lupa password hosting"*, *"Dapat ide baru yang lebih seru"*.

Saat submit:

1. Validasi dengan pesan error inline yang ramah (dan lucu).
2. Animasi nisan turun ke pemakaman, lalu nisan baru muncul di grid dan ter-highlight sebentar.
3. Langsung membuka **Modal Sertifikat Kematian**.

### 8.6 Modal Sertifikat Kematian

- Kartu estetik rapi berisi: nama wacana, kategori, pembuat, tanggal lahir dan gugur, durasi hidup, penyebab, epitaph, kerugian, nomor sertifikat unik, dan branding Wacana.rip.
- Tombol **Download sebagai Gambar (PNG)** memakai library **`html-to-image`**. Pastikan font dan background ikut ter-render, dan tangani error dengan pesan yang jelas.
- Tombol tutup dan kembali ke pemakaman.

## 9. Non-Fungsional

- **Responsif:** nyaman di mobile (min 360px) sampai desktop.
- **Performa:** animasi memakai `transform` dan `opacity`, partikel dibatasi, tidak ada re-render berlebihan pada grid.
- **Aksesibilitas:** kontras teks cukup di background gelap, semua tombol bisa diakses keyboard, ikon-only button punya `aria-label`, `prefers-reduced-motion` dihormati.
- **Kualitas kode:** TypeScript strict, tanpa `any`, tanpa error TS atau lint, tidak ada placeholder kosong, semua komponen interaktif berfungsi.
- **Keamanan input:** trim dan batasi panjang di service; tidak ada HTML injection; ID dibuat dengan `crypto.randomUUID()` (dengan fallback).

## 10. Struktur Proyek yang Disarankan

```
src/
  app/
    layout.tsx
    page.tsx
    globals.css
  components/
    Header.tsx
    StatsBanner.tsx
    AmbientBackground.tsx
    FilterBar.tsx
    TombstoneCard.tsx
    TombstoneGrid.tsx
    GraveDetailModal.tsx
    BuryModal.tsx
    DeathCertificateModal.tsx
    FlowerBurst.tsx
  hooks/
    useGraveyard.ts
  lib/
    graveyardService.ts
    seedData.ts
    utils.ts        // durasi, tipe nisan, format Rupiah
  types/
    graveyard.ts
```

## 11. Rencana Checkpoint (untuk Coding Agent)

Setiap checkpoint harus berjalan tanpa error (`npm run build` lolos) sebelum lanjut.

1. **Setup, tipe, service, seed.** Init Next.js + dependensi, `types`, `utils` (durasi dan tipe nisan), `graveyardService`, `seedData`, hook `useGraveyard`.
2. **Layout, background, banner.** Layout global, font, `AmbientBackground` (kabut dan kunang-kunang), `Header`, `StatsBanner`.
3. **Grid, filter, sort, search.** `TombstoneCard` dengan 3 tipe tekstur, `TombstoneGrid`, `FilterBar`, tombol bunga dan lilin beserta animasinya.
4. **Modal detail dan komentar.** `GraveDetailModal`, form komentar dengan validasi, aksesibilitas modal.
5. **Modal ritual dan sertifikat.** `BuryModal` dengan validasi dan durasi otomatis, animasi nisan turun, `DeathCertificateModal` dan download PNG.
6. **Polish.** Cek mobile, reduced motion, empty state, error handling storage, README.

## 12. Kriteria Penerimaan (MVP Selesai Jika)

- [ ] Delapan seed data muncul saat pertama buka dan mencakup ketiga tipe nisan.
- [ ] Banner statistik benar dan berubah saat ada makam baru atau bunga ditabur.
- [ ] Filter kategori, sort, dan search bisa dikombinasikan dengan benar.
- [ ] Bunga dan lilin berfungsi, tersimpan setelah refresh, dan beranimasi.
- [ ] Modal detail menampilkan kronologi dan kerugian, serta komentar bisa ditambahkan dan tersimpan.
- [ ] Form ritual tervalidasi, durasi dihitung otomatis, nisan baru muncul dengan animasi.
- [ ] Sertifikat bisa di-download sebagai PNG.
- [ ] Tidak ada hydration warning di console dan `npm run build` sukses tanpa error TypeScript.
- [ ] Tampilan rapi di mobile dan desktop, dan animasi menghormati `prefers-reduced-motion`.

## 13. Rencana Setelah MVP

- Migrasi `graveyardService` ke Supabase (tabel `makam`, `komentar`; bunga dan lilin sebagai counter atau tabel terpisah).
- Statistik kolektif sungguhan, rate limiting, dan moderasi komentar.
- Halaman makam individual yang bisa dibagikan (`/makam/[id]`) dengan OG image otomatis.
- Mode "ziarah acak" dan sertifikat dengan lebih banyak tema.

# PRD v2: Login, Bunga Harian, Animasi Tebal, Share ke Story IG

**Status:** MVP (checkpoint 1–6) selesai. Dokumen ini menggantikan bagian "Non-Tujuan" dan "Rencana Setelah MVP" di atas untuk fitur yang tercantum.

## 14. Tujuan v2

1. **Login:** pengguna bisa masuk, dan aksi yang menulis data butuh akun.
2. **Bunga 1x per hari:** tiap pengguna hanya bisa menabur 1 bunga per makam per hari.
3. **Animasi lebih tebal:** interaksi terasa "hidup" dan memuaskan, bukan sekadar +1 counter.
4. **Share ke Story IG:** sertifikat atau makam bisa jadi gambar 9:16 siap upload, plus link yang bisa dibuka publik.

Konsekuensinya, **localStorage tidak cukup lagi**. Aturan "1 hari sekali" dan login harus ditegakkan di server, karena kalau cuma di browser, pengguna bisa menipunya dengan menghapus data. Maka v2 memakai **Supabase** (Auth + Postgres + RLS), sesuai rencana awal `graveyardService`.

## 15. Keputusan dan Asumsi

| Topik | Keputusan |
| --- | --- |
| Backend | Supabase (Auth, Postgres, Row Level Security), integrasi Next.js App Router lewat `@supabase/ssr` |
| Metode login | Google OAuth + magic link email |
| Yang butuh login | Kuburkan wacana, tabur bunga, nyalakan lilin, komentar, hapus milik sendiri |
| Yang tanpa login | Melihat pemakaman, filter, search, detail makam, halaman publik `/makam/[id]` |
| Reset bunga harian | Tengah malam **WIB (Asia/Jakarta)**, dihitung di database, bukan di jam perangkat pengguna |
| Anonim | Pengguna tetap login, tapi bisa memilih nama tampil "Anonim" per makam. `user_id` tetap tersimpan untuk keamanan dan hak hapus |
| Share IG Story | Instagram tidak punya API web untuk memposting Story langsung. Solusinya: generate gambar 1080×1920, lalu bagikan lewat Web Share API (menu share ponsel, pilih Instagram > Story). Fallback: download PNG + tombol salin link |
| Seed data | Dimasukkan ke database sebagai makam milik "sistem" (`user_id` null), tidak bisa dihapus pengguna |

## 16. Model Data (Postgres)

```sql
-- profil publik minimal
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) <= 30),
  created_at timestamptz default now()
);

create table makam (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,  -- null = seed sistem
  judul text not null check (char_length(judul) <= 120),
  kategori text not null check (kategori in ('skripsi','koding','desain','bisnis','resolusi')),
  tampil_anonim boolean not null default false,
  tanggal_mulai date not null,
  tanggal_menyerah date not null check (tanggal_menyerah >= tanggal_mulai),
  penyebab text not null,
  epitaph text not null check (char_length(epitaph) <= 140),
  kronologi text check (char_length(kronologi) <= 1000),
  kerugian_teks text,
  kerugian_rupiah bigint check (kerugian_rupiah >= 0),
  kerugian_jam numeric check (kerugian_jam >= 0),
  bunga_count int not null default 0,
  lilin_count int not null default 0,
  created_at timestamptz default now()
);

create table bunga (
  id uuid primary key default gen_random_uuid(),
  makam_id uuid not null references makam on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  hari date not null default ((now() at time zone 'Asia/Jakarta')::date),
  created_at timestamptz default now(),
  unique (makam_id, user_id, hari)   -- penegak aturan 1x per hari
);

create table lilin (
  makam_id uuid not null references makam on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz default now(),
  primary key (makam_id, user_id)
);

create table komentar (
  id uuid primary key default gen_random_uuid(),
  makam_id uuid not null references makam on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  nama_tampil text not null check (char_length(nama_tampil) <= 30),
  isi text not null check (char_length(isi) between 1 and 280),
  created_at timestamptz default now()
);

create table laporan (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('makam','komentar')),
  target_id uuid not null,
  user_id uuid not null references auth.users on delete cascade,
  alasan text check (char_length(alasan) <= 200),
  created_at timestamptz default now()
);
```

**Aturan penting:**

- `bunga_count` dan `lilin_count` diperbarui lewat **trigger** atau fungsi RPC (`tabur_bunga(makam_id)`, `toggle_lilin(makam_id)`), bukan dari client.
- Insert ke `bunga` yang melanggar unique `(makam_id, user_id, hari)` ditangkap dan dikembalikan sebagai status "sudah menabur hari ini", bukan error mentah.
- **RLS aktif di semua tabel.** Baca makam dan komentar: publik. Tulis: hanya user yang login dan hanya atas nama `auth.uid()`. Update dan delete makam atau komentar: hanya pemilik. Seed (`user_id` null) tidak bisa diubah pengguna.
- Rate limit komentar di sisi database atau RPC (misalnya maksimal 5 komentar per jam per pengguna) dan maksimal makam baru per hari per pengguna.
- Total statistik banner dihitung lewat view atau RPC agregat (`count`, `sum`), bukan menarik semua baris.

## 17. Aturan Bunga Harian

- Satu pengguna dapat menabur **1 bunga per makam per hari (WIB)**. Boleh menabur di makam berbeda pada hari yang sama.
- Tombol berubah status: **"Tabur Bunga"** (aktif), **"Sudah menabur hari ini · lagi dalam 05:32:10"** (nonaktif, countdown ke tengah malam WIB), dan **"Masuk untuk menabur"** (belum login).
- Pembuat makam boleh menabur di makamnya sendiri (tetap 1x per hari).
- Pembatasan ditegakkan di server. UI hanya menampilkan statusnya, dan harus menangani respons "sudah menabur" dengan ramah (tanpa error merah).

## 18. Spesifikasi Animasi "Tebal"

Tujuannya terasa **dramatis dan memuaskan**, tapi tetap ringan. Semua animasi hanya memakai `transform` dan `opacity`.

### 18.1 Tabur Bunga

- **Hujan kelopak** dari atas nisan dengan variasi ukuran, warna (merah muda, putih, ungu pucat), rotasi 3D ringan, dan goyangan kiri-kanan. Jumlah: 28–40 di desktop, 12–18 di mobile.
- **Pulse cahaya** (glow) di sekeliling nisan dan riak cahaya di tanah.
- Counter bunga memantul (spring) saat bertambah, dengan angka `+1` melayang naik lalu memudar.
- Kelopak yang jatuh **menetap** di dasar nisan sebagai tumpukan bunga kecil, jumlahnya mengikuti `bunga_count` (dibatasi maksimal sekitar 12 elemen visual).
- Getar halus perangkat (`navigator.vibrate(15)`) bila didukung, dan suara lembut opsional (default mati, ada toggle yang tersimpan).
- **Milestone:** makam dengan 10, 50, dan 100 bunga mendapat aura emas dan lencana kecil di kartu. Saat mencapai milestone, ada animasi khusus satu kali.

### 18.2 Lilin

- Api berkedip dengan variasi acak (CSS keyframes), **halo cahaya hangat** yang ikut berkedip dan menerangi area sekitar kartu.
- Saat dimatikan: asap tipis naik lalu hilang.
- Counter lilin ditampilkan di samping ikon.

### 18.3 Atmosfer

- Kabut berlapis dengan efek parallax.
- Siluet hantu kecil sesekali melayang di background (jarang, bisa dimatikan).
- Kartu nisan miring tipis mengikuti kursor di desktop (hover tilt), dan glow saat hover.
- Transisi halaman dan modal lebih sinematik (fade + scale + blur ringan).

### 18.4 Ritual Pemakaman

- Nisan turun dengan debu dan partikel tanah, getar layar singkat, riak di tanah, lalu menyala sesaat.
- Di sertifikat, stempel **"R.I.P"** menghantam dengan animasi scale dan getar kecil.

### 18.5 Batas Performa dan Aksesibilitas

- Anggaran partikel serentak: maksimal sekitar 60 di desktop dan 25 di mobile. Efek baru yang melewati batas mengantre atau mengurangi jumlahnya.
- Animasi dijeda saat tab tidak terlihat.
- Deteksi performa rendah (misalnya fps turun terus) mengurangi kepadatan partikel secara otomatis.
- `prefers-reduced-motion`: semua efek berat diganti indikator sederhana (`+1`, perubahan warna), dan toggle "Efek ringan" tersedia di UI untuk siapa pun.

## 19. Share ke Story IG

### 19.1 Template Gambar

- Komponen khusus `StoryTemplate` berukuran **1080×1920 (9:16)**, bukan screenshot modal. Disembunyikan di luar layar saat dirender.
- Isi: siluet nisan sesuai tipe (kayu, granit, marmer), judul wacana, tanggal lahir–gugur dan durasi, penyebab kematian, epitaph, kerugian, logo **Wacana.rip**, dan teks link `wacana.rip/makam/[id]`.
- Beberapa tema pilihan (misal: Malam Gelap, Kabut Ungu, Lilin Hangat). Pengguna memilih lewat pratinjau sebelum membagikan.
- Zona aman: konten penting jauh dari 250px teratas dan bawah, supaya tidak tertutup UI Instagram.

### 19.2 Alur Berbagi

1. Tombol **"Bagikan ke Story"** di Modal Sertifikat dan Modal Detail Makam.
2. Generate PNG dengan `html-to-image` (tunggu `document.fonts.ready`, ubah gambar menjadi data URI, `pixelRatio` sesuai).
3. Jika `navigator.canShare({ files })` tersedia, panggil `navigator.share({ files, text, url })` agar muncul menu share ponsel. Dari sana pengguna memilih Instagram > Story.
4. Jika tidak tersedia (misalnya desktop), unduh PNG dan tampilkan petunjuk singkat: "Upload gambar ini ke Story, lalu tempel link (salin dengan tombol di bawah)." Sediakan tombol **Salin Link**.
5. Tangani kegagalan dengan pesan yang jelas, sama seperti download PNG yang sudah ada.

Catatan: link tidak bisa dimasukkan otomatis sebagai stiker Instagram. Karena itu, link ditulis di dalam gambar dan disediakan tombol salin untuk ditempel sebagai stiker link secara manual.

### 19.3 Halaman Publik dan Preview Link

- Rute **`/makam/[id]`** menampilkan makam secara publik (tanpa login), lengkap dengan tombol login untuk bunga, lilin, dan komentar.
- `generateMetadata` dan gambar OG dinamis (`next/og`) agar saat link dibagikan ke WhatsApp, X, dan lainnya muncul pratinjau nisan yang rapi.

## 20. Autentikasi dan UI Login

- Tombol **Masuk** di header. Setelah login: avatar atau nama tampil, menu berisi Makam Saya dan Keluar.
- Modal login: **Lanjutkan dengan Google** dan **Kirim magic link ke email**. Teks lucu, misal: "Masuk dulu biar bisa melayat."
- Aksi yang butuh login memunculkan modal login lalu **melanjutkan aksi** setelah berhasil (misal tetap membuka form kuburkan wacana).
- Halaman **Makam Saya**: daftar makam milik pengguna, dengan opsi hapus.
- Pengguna bisa menghapus makam dan komentar miliknya. Tombol **Laporkan** di makam dan komentar orang lain.
- Sesi dikelola lewat `@supabase/ssr` (cookie), dan komponen server dan client tidak boleh membocorkan service role key. Kunci `anon` saja yang dipakai di client.

## 21. Keamanan dan Moderasi

- RLS adalah garis pertahanan utama, jangan hanya mengandalkan validasi di UI.
- Validasi panjang dan trim di database (constraint) dan di server.
- Semua teks pengguna dirender sebagai teks biasa.
- Filter kata kasar dasar untuk judul, epitaph, dan komentar, ditambah laporan pengguna. Makam yang dilaporkan beberapa kali bisa disembunyikan sementara (flag `disembunyikan`).
- Jangan menyimpan data pribadi berlebih. Beri peringatan di form: "Jangan tulis nama atau data pribadi orang lain."
- Variabel lingkungan (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) lewat `.env.local`, dan `.env.example` disertakan di repo.

## 22. Rencana Checkpoint v2

Setiap checkpoint harus lolos `npm run lint` dan `npm run build` sebelum lanjut. Agen tidak boleh mengubah dependency lain di luar yang disebut.

### Checkpoint 7: Supabase dan Migrasi Service

```
Checkpoint 7: Backend Supabase.

1. Install @supabase/supabase-js dan @supabase/ssr. Buat src/lib/supabase/client.ts, server.ts, dan middleware untuk refresh sesi.
2. Buat file supabase/schema.sql sesuai bagian 16 PRD v2 (tabel, constraint, trigger count, fungsi RPC tabur_bunga dan toggle_lilin, view statistik, RLS lengkap). Tambahkan supabase/seed.sql dengan 8 seed (user_id null).
3. Tulis ulang isi src/lib/graveyardService.ts agar memakai Supabase. Signature fungsi tetap async dan sebisa mungkin sama. Tambahkan fungsi baru: getStatusBungaHariIni, getLilinSaya, hapusMakam, hapusKomentar, laporkan.
4. Buat .env.example dan update README (cara setup project Supabase, jalankan schema, isi env).
5. Jangan ubah UI selain yang perlu agar kompatibel. Jika env belum diisi, tampilkan pesan konfigurasi yang jelas, bukan crash.
```

### Checkpoint 8: Login

```
Checkpoint 8: Autentikasi.

1. Login Google OAuth dan magic link email lewat Supabase Auth. Buat route /auth/callback.
2. Header: tombol Masuk, setelah login tampil avatar atau nama dan menu (Makam Saya, Keluar).
3. LoginModal bertema. Aksi yang butuh login (kuburkan, bunga, lilin, komentar) membuka modal ini, lalu melanjutkan aksi setelah berhasil.
4. Buat profiles otomatis saat user pertama masuk (trigger atau saat callback). Nama tampil default dari akun, bisa diubah.
5. Halaman /saya (Makam Saya) dengan opsi hapus makam milik sendiri.
6. Form kuburkan: tambah opsi "Tampilkan sebagai Anonim".
```

### Checkpoint 9: Bunga Harian dan Lilin Server-Side

```
Checkpoint 9: Aturan bunga dan lilin.

1. Tabur bunga lewat RPC tabur_bunga: 1 bunga per user per makam per hari (WIB). Tangani respons "sudah menabur" tanpa error mentah.
2. Tombol punya 3 status: aktif, sudah menabur (countdown ke tengah malam WIB), dan Masuk untuk menabur.
3. Lilin toggle per user lewat RPC. Counter lilin tampil. Api menyala jika lilin_count > 0.
4. Gunakan optimistic update dengan rollback jika server menolak.
5. Statistik banner dari view atau RPC agregat.
```

### Checkpoint 10: Animasi Tebal

```
Checkpoint 10: Animasi sesuai bagian 18 PRD v2.

1. FlowerBurst baru: hujan kelopak 28-40 (desktop) / 12-18 (mobile), glow, riak, counter spring, +1 melayang, tumpukan bunga di dasar nisan (maks ~12 elemen visual).
2. Lilin: halo cahaya berkedip dan asap saat dimatikan.
3. Hover tilt kartu di desktop, parallax kabut, hantu langka (bisa dimatikan).
4. Ritual: nisan turun dengan debu dan getar, stempel R.I.P pada sertifikat.
5. Milestone 10/50/100 bunga: aura emas dan lencana.
6. Anggaran partikel serentak (60 desktop / 25 mobile), jeda saat tab tersembunyi, penurunan otomatis jika fps rendah, toggle "Efek ringan", dan hormati prefers-reduced-motion.
7. Hanya transform dan opacity. Tidak ada layout thrash.
```

### Checkpoint 11: Share ke Story IG dan Halaman Publik

```
Checkpoint 11: Share.

1. StoryTemplate 1080x1920 (zona aman 250px atas dan bawah) dengan 3 tema dan pratinjau pilihan tema.
2. Generate PNG dengan html-to-image (tunggu document.fonts.ready, gambar jadi data URI).
3. Bagikan lewat navigator.share({ files }) jika canShare tersedia. Fallback: unduh PNG, petunjuk singkat, dan tombol Salin Link.
4. Route publik /makam/[id] dengan generateMetadata dan gambar OG dinamis (next/og).
5. Tombol Bagikan ke Story di Modal Sertifikat dan Modal Detail.
6. Tampilkan error yang jelas jika gagal. Uji di Chrome Android dan Safari iOS.
```

### Checkpoint 12: Moderasi dan Polish

```
Checkpoint 12: Moderasi dan polish.

1. Tombol Laporkan di makam dan komentar, tabel laporan, flag disembunyikan setelah beberapa laporan.
2. Filter kata kasar dasar di judul, epitaph, dan komentar.
3. Rate limit komentar dan pembuatan makam (database atau RPC).
4. Peringatan di form: jangan tulis data pribadi orang lain.
5. Cek 360px, 768px, 1280px, empty state, dan pesan error jaringan.
6. npm audit (laporkan saja), lint, build.
```

## 23. Kriteria Penerimaan v2

- [ ] Pengguna bisa masuk lewat Google dan magic link, dan keluar.
- [ ] Tanpa login, pengunjung bisa melihat semuanya tapi tidak bisa menulis.
- [ ] Menabur bunga kedua kali di makam yang sama pada hari yang sama (WIB) ditolak server, dan UI menampilkan countdown.
- [ ] Esok harinya (setelah tengah malam WIB) bunga bisa ditabur lagi.
- [ ] Pengguna lain tidak bisa mengedit atau menghapus makam dan komentar milikmu (diuji lewat RLS).
- [ ] Animasi bunga, lilin, dan ritual terasa jauh lebih "tebal", tetap mulus di ponsel menengah, dan menghormati reduced motion.
- [ ] Tombol Bagikan ke Story menghasilkan gambar 1080×1920 yang rapi, terbuka di menu share ponsel, dan punya fallback di desktop.
- [ ] Link `/makam/[id]` terbuka publik dan menampilkan pratinjau yang benar saat dibagikan.
- [ ] Tidak ada secret yang bocor ke client, `.env.example` tersedia, dan README menjelaskan setup.
- [ ] `npm run lint` dan `npm run build` lolos tanpa error.
