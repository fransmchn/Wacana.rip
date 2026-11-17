export const KATEGORI = ["skripsi", "koding", "desain", "bisnis", "resolusi", "hubungan", "pribadi", "pekerjaan", "keluarga", "kesehatan", "perjalanan", "lainnya"] as const;
export type Kategori = (typeof KATEGORI)[number];

export type TipeNisan = "kayu" | "granit" | "marmer";

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
  lilin: boolean;
  lilinCount?: number;
  komentar: Komentar[];
  createdAt: string;
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
