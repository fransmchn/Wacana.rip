import type { Makam, TipeNisan } from "@/types/graveyard";

const DAY_MS = 24 * 60 * 60 * 1000;

export function getDurasiHari(tanggalMulai: string, tanggalMenyerah: string): number {
  const mulai = new Date(tanggalMulai).getTime();
  const menyerah = new Date(tanggalMenyerah).getTime();
  return Math.max(0, Math.floor((menyerah - mulai) / DAY_MS));
}

export function getLabelDurasi(durasiHari: number): string {
  if (durasiHari === 0) return "kurang dari sehari";
  return `${durasiHari} ${durasiHari === 1 ? "hari" : "hari"}`;
}

export function getTipeNisan(tanggalMulai: string, tanggalMenyerah: string): TipeNisan {
  const durasi = getDurasiHari(tanggalMulai, tanggalMenyerah);
  if (durasi < 3) return "kayu";
  if (durasi <= 90) return "granit";
  return "marmer";
}

export function formatTanggal(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactRupiah(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
  if (absolute >= 1_000_000) return `Rp ${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  if (absolute >= 1_000) return `Rp ${(value / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} rb`;
  return formatRupiah(value);
}

export function formatKerugian(makam: Pick<Makam, "kerugianRupiah" | "kerugianJam">): string {
  const values: string[] = [];
  if (makam.kerugianRupiah) values.push(formatRupiah(makam.kerugianRupiah));
  if (makam.kerugianJam) values.push(`${makam.kerugianJam} jam`);
  return values.join(" · ") || "Belum dihitung";
}

export interface ErosionInfo {
  daysLeft: number;
  progress: number;
  label: string;
}

/**
 * Makam gratis hanya bertahan 7 hari sebelum terkubur. Karena data seed
 * bisa berusia berbulan-bulan, siklus dipakai supaya indikator tetap
 * bercerita (dan tidak pernah menampilkan "0 hari").
 */
export function getErosionInfo(makam: Pick<Makam, "createdAt">): ErosionInfo {
  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(makam.createdAt).getTime()) / DAY_MS));
  const daysLeft = 7 - (elapsed % 7);
  return {
    daysLeft,
    progress: Math.round(((7 - daysLeft) / 7) * 100),
    label: `Terkubur dalam ${daysLeft} hari`,
  };
}

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
