# Wacana.rip

Digital graveyard untuk ide, tugas, dan proyek yang gagal atau ditinggalkan.

## Status

MVP localStorage selesai. Checkpoint 7 menambahkan fondasi Supabase untuk migrasi v2. UI masih memakai localStorage sampai autentikasi checkpoint 8 selesai.

## Jalankan lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Setup Supabase v2

1. Buat project Supabase.
2. Salin `.env.example` menjadi `.env.local`.
3. Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Buka SQL Editor Supabase.
5. Jalankan `supabase/schema.sql`.
6. Jalankan `supabase/seed.sql`.

`schema.sql` membuat tabel, constraint, RPC bunga/lilin, view statistik, trigger profile, dan RLS. Jangan masukkan service role key ke client atau `.env.local` yang dibagikan.

## Checkpoint

- Checkpoint 1–6: tipe, seed, localStorage service, UI, modal, animasi polish.
- Checkpoint 7: client/server Supabase, middleware refresh sesi, schema, seed SQL, RPC, RLS.
- Checkpoint 8+: login, service Supabase aktif, bunga harian, share Story, moderasi.

## Verifikasi

```bash
npm run lint
npm run build
npm audit
npm run qa:ui
```

Panduan token, primitive, preview `/dev/ui`, dan QA ada di [`docs/UI-GUIDE.md`](docs/UI-GUIDE.md). QA Playwright hanya devDependency dan `/dev/ui` ditolak pada production.

Statistik MVP localStorage bersifat lokal. Setelah service Supabase diaktifkan, statistik dibaca dari agregat database.

## Uji RLS

Dengan `.env.local` berisi URL dan anon key, jalankan `npm run dev`. Tanpa login, halaman dan detail makam tetap bisa dibaca. Klik `Kuburkan Wacana`, tombol bunga, lilin, atau komentar: `LoginModal` harus terbuka dan tidak ada write request anonim.

Login lewat Google atau magic link. Setelah callback kembali ke `/`, ulangi aksi. Insert makam, bunga melalui RPC, lilin melalui RPC, dan komentar harus berhasil atas `auth.uid()` sendiri.

Untuk uji database langsung di Supabase SQL Editor, jangan memakai service role. Gunakan client anon melalui aplikasi untuk mempertahankan JWT. Uji isolasi dengan dua akun: akun B tidak boleh menghapus atau mengubah makam/komentar milik akun A; seed `user_id is null` tidak boleh diubah. Query publik `select` tetap boleh membaca makam dan komentar.

Jika env Supabase kosong:

- development: localStorage fallback aktif.
- production: service menolak operasi dan UI menampilkan pesan konfigurasi. Tidak ada fallback localStorage.

Tidak ada service role key di client, source code, atau variabel `NEXT_PUBLIC_`.
