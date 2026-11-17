# UI guide

Wacana.rip memakai tema gelap gothic. Gunakan token dan primitive sebelum menulis CSS baru.

## Token

- Warna: `--night`, `--night-soft`, `--surface`, `--surface-2`, `--border-subtle`, `--text`, `--text-muted`, `--dim`, `--rose`, `--rose-bright`, `--gold`, `--danger`, `--success`, `--focus-ring`.
- Tipografi: `--font-space-grotesk`, `--font-dm-mono`, `--font-newsreader`, `--text-display`, `--text-h2`, `--text-h3`, `--text-body`, `--text-small`, `--text-label`.
- Spacing: `--space-1` sampai `--space-24`.
- Radius: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`.
- Shadow: `--shadow-1`, `--shadow-2`, `--shadow-3`.
- Motion: `--duration-fast`, `--duration-standard`, `--duration-slow`, `--ease-standard`.

Tidak ada hex UI. Hindari nilai px liar; gunakan token. Hex `certificatePalette` hanya untuk PNG sertifikat.

## Primitive

- `Button`: aksi berlabel. Ukuran `sm` 32px, `md` 40px, `lg` 48px.
- `IconButton`: aksi ikon tanpa label visual. Minimum 40×40px, wajib `label`.
- `Input`, `Textarea`, `Select`: input form. Input/select 44px; textarea minimum tiga baris.
- `Chip`: filter atau pilihan ringkas, tinggi 36px.
- `Dialog`: modal dengan header, satu body scroll, footer opsional, focus trap, dan scroll lock.
- `Avatar`, `Badge`, `Tooltip`, `Toast`, `EmptyState`, `Skeleton`, `Switch`: gunakan sesuai peran semantik.

Semua tombol berikon wajib memakai Lucide dan ukuran 16, 18, atau 24px. Raw form control hanya boleh berada di primitive; pengecualian saat ini: checkbox toggle kerugian dan hidden file input karena perilaku native.

## Menjalankan preview dan QA

```bash
npm run dev
```

Buka `http://localhost:3000/dev/ui` saat development. Route ini memakai `notFound()` pada production build.

```bash
npm run qa:ui
```

Perintah ini memakai Playwright Chromium, menguji `/` dan `/dev/ui` pada empat viewport, lalu menulis screenshot ke `qa/screens/` dan data ke `qa/ui-results.json`.

## Menambah komponen

1. Cari primitive yang sudah ada.
2. Pakai token untuk warna, spacing, radius, shadow, dan motion.
3. Tambah state focus-visible dan label aksesibel.
4. Tambah contoh ke `/dev/ui` bila primitive baru.
5. Jalankan lint, build, tes, dan `qa:ui`.

## Supabase profile

`supabase/profile_v2.sql` sudah dijalankan manual. Urutan: jalankan `profile_v2.sql`; hardening `handle_new_user` sudah termasuk di file tersebut. Jangan mengubah service, RPC, RLS, auth, atau migration tanpa checkpoint terpisah.
