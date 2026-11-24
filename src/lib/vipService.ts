import type { Makam } from "@/types/graveyard";

export const VIP_PRICE = 15_000;
export const VIP_STORAGE_KEY = "wacana-rip:vip";

export type PaymentMethod = "qris" | "ewallet";

export interface VipUpgradeResult {
  graveId: string;
  ids: string[];
  method: PaymentMethod;
  receiptId: string;
  paidAt: string;
}

export function getVipIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(VIP_STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/** Satu sumber kebenaran untuk status VIP (data, demo, atau pembelian lokal). */
export function isVipMakam(makam: Pick<Makam, "id" | "vip" | "bunga">, ids: string[] = getVipIds()): boolean {
  return Boolean(makam.vip) || makam.bunga >= 20 || ids.includes(makam.id);
}

/**
 * Satu-satunya pintu upgrade VIP. Saat ini melakukan checkout simulasi dan
 * menyimpan hasilnya lokal. Untuk produksi, ganti blok `TODO(gateway)` dengan
 * charge Midtrans/Xendit/Mayar lalu panggil backend—UI tidak perlu diubah.
 */
export async function upgradeToVip(graveId: string, method: PaymentMethod = "qris"): Promise<VipUpgradeResult> {
  if (!graveId) throw new Error("Makam tidak ditemukan.");

  // TODO(gateway): create payment charge with { amount: VIP_PRICE, method, graveId }.
  await new Promise((resolve) => window.setTimeout(resolve, 650));
  // TODO(gateway): verify payment status from server before persisting.

  const ids = Array.from(new Set([...getVipIds(), graveId]));
  window.localStorage.setItem(VIP_STORAGE_KEY, JSON.stringify(ids));

  return {
    graveId,
    ids,
    method,
    receiptId: `VIP-${Date.now().toString(36).toUpperCase()}`,
    paidAt: new Date().toISOString(),
  };
}
