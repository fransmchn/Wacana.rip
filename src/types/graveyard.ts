export const KATEGORI = ["skripsi", "koding", "desain", "bisnis", "resolusi", "hubungan", "pribadi", "pekerjaan", "keluarga", "kesehatan", "perjalanan", "lainnya"] as const;
export type Kategori = (typeof KATEGORI)[number];

/**
 * Nilai yang benar-benar diterima `makam_kategori_check` di Supabase.
 * Schema/seed/PRD repo memakai lima nilai ini; remote lama belum mengikuti
 * daftar UI 12 kategori, jadi kategori lain dipetakan ke nilai terdekat.
 */
export const KATEGORI_DB = ["skripsi", "koding", "desain", "bisnis", "resolusi"] as const;
export type KategoriDb = (typeof KATEGORI_DB)[number];
export const DEFAULT_KATEGORI_DB: KategoriDb = "resolusi";

export const KATEGORI_DB_FALLBACK: Record<Kategori, KategoriDb> = {
  skripsi: "skripsi",
  koding: "koding",
  desain: "desain",
  bisnis: "bisnis",
  resolusi: "resolusi",
  hubungan: "resolusi",
  pribadi: "resolusi",
  pekerjaan: "bisnis",
  keluarga: "resolusi",
  kesehatan: "resolusi",
  perjalanan: "resolusi",
  lainnya: "resolusi",
};

/** Trim + lowercase + petakan ke nilai yang aman untuk constraint Supabase. */
export function normalizeKategori(value: unknown): KategoriDb {
  const clean = typeof value === "string" ? value.trim().toLowerCase() : "";
  if ((KATEGORI_DB as readonly string[]).includes(clean)) return clean as KategoriDb;
  if ((KATEGORI as readonly string[]).includes(clean)) return KATEGORI_DB_FALLBACK[clean as Kategori];
  return DEFAULT_KATEGORI_DB;
}

export const NISAN_TEMA = ["batu-lapuk", "beton-retak", "obsidian-emas", "marmer-lumut", "y2k-chrome", "crimson-velvet"] as const;
export type NisanTema = (typeof NISAN_TEMA)[number];

export interface Komentar {
  id: string;
  nama: string;
  isi: string;
  createdAt: string;
}

export interface Makam {
  id: string;
  judul: string;
  kategori: Kategori;
  pembuat: string;
  tanggalMulai: string;
  tanggalMenyerah: string;
  penyebab: string;
  epitaph: string;
  kronologi: string;
  kerugianTeks: string;
  kerugianRupiah?: number;
  kerugianJam?: number;
  bunga: number;
  /** Tema nisan yang dipilih pembuat. Selalu ada fallback deterministik. */
  tema?: NisanTema;
  /** Makam Abadi VIP — dikunci dari erosi dan memakai monumen lebih besar. */
  vip?: boolean;
  /** Pemilik makam; dipakai untuk daftar dan aksi CRUD di profil. */
  userId?: string;
  komentar: Komentar[];
  createdAt: string;
}

export interface EditMakamInput {
  judul: string;
  kategori: Kategori;
  penyebab: string;
  epitaph: string;
  tema: NisanTema;
}

export interface CreateMakamInput {
  judul: string;
  kategori: Kategori;
  pembuat?: string;
  tanggalMulai: string;
  tanggalMenyerah: string;
  penyebab: string;
  epitaph: string;
  kronologi?: string;
  kerugianTeks?: string;
  kerugianRupiah?: number;
  kerugianJam?: number;
  tema: NisanTema;
  vip?: boolean;
}

export interface KomentarInput {
  nama?: string;
  isi: string;
}

export interface Statistik {
  totalMakam: number;
  totalBunga: number;
  totalRupiah: number;
  totalJam: number;
}
