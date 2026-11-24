import { moveThemeOverride, removeThemeOverride, setThemeOverride } from "@/lib/themeService";
import { isTemaVip } from "@/lib/themes";
import type { CreateMakamInput, Makam, NisanTema } from "@/types/graveyard";

export const VIP_PRICE = 15_000 as const;
export const VIP_STORAGE_KEY = "wacana-rip:vip";
const TRANSACTION_KEY = "wacana-rip:checkout";

export type PaymentMethod = "qris" | "ewallet";
export type TransactionStatus = "pending" | "paid" | "failed";

/** Satu-satunya kontrak yang dikirim UI ke lapisan pembayaran. */
export interface CreateCheckoutParams {
  graveId: string;
  graveTitle: string;
  selectedTheme: NisanTema;
  amount: 15000;
  userId?: string;
  method?: PaymentMethod;
  metadata?: { draft?: boolean };
}

export interface PaymentTransaction {
  id: string;
  status: TransactionStatus;
  method: PaymentMethod;
  params: CreateCheckoutParams;
  createdAt: string;
  paidAt?: string;
}

export interface VipUpgradeResult {
  graveId: string;
  ids: string[];
  method: PaymentMethod;
  receiptId: string;
  paidAt: string;
  transaction: PaymentTransaction;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* localStorage tidak tersedia; status tetap berlaku di memori provider. */
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") { resolve(); return; }
    window.setTimeout(resolve, ms);
  });
}

export function getVipIds(): string[] {
  const parsed = readJson<unknown>(VIP_STORAGE_KEY, []);
  return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
}

function setVipIds(ids: string[]): string[] {
  const unique = Array.from(new Set(ids));
  writeJson(VIP_STORAGE_KEY, unique);
  return unique;
}

/** Satu sumber kebenaran status VIP: data server, ritual, tema, atau pembelian lokal. */
export function isVipMakam(
  makam: Pick<Makam, "id" | "vip" | "bunga" | "tema">,
  ids: string[] = getVipIds(),
): boolean {
  return Boolean(makam.vip) || makam.bunga >= 20 || isTemaVip(makam.tema) || ids.includes(makam.id);
}

export function getTransactions(): PaymentTransaction[] {
  const parsed = readJson<unknown>(TRANSACTION_KEY, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is PaymentTransaction => Boolean(item && typeof item === "object" && "id" in item && "params" in item));
}

function saveTransactions(transactions: PaymentTransaction[]): void {
  writeJson(TRANSACTION_KEY, transactions.slice(-20));
}

/**
 * TODO(gateway): ganti dengan POST /api/checkout (Midtrans/Mayar) dan simpan
 * redirect_url/snap_token di PaymentTransaction. UI tidak perlu diubah.
 */
export async function createCheckout(params: CreateCheckoutParams, method: PaymentMethod = params.method ?? "qris"): Promise<PaymentTransaction> {
  if (!params.graveId?.trim()) throw new Error("Makam tidak ditemukan.");
  if (params.amount !== VIP_PRICE) throw new Error("Nominal upgrade tidak valid.");
  await delay(180);
  const transaction: PaymentTransaction = {
    id: `TRX-${Date.now().toString(36).toUpperCase()}`,
    status: "pending",
    method,
    params: { ...params, method },
    createdAt: new Date().toISOString(),
  };
  saveTransactions([...getTransactions(), transaction]);
  return transaction;
}

/**
 * TODO(gateway): ganti dengan verifikasi webhook/server sebelum status paid.
 * Saat ini hanya simulasi dan menulis ke localStorage.
 */
export async function completeCheckout(transactionId: string): Promise<VipUpgradeResult> {
  const transactions = getTransactions();
  const index = transactions.findIndex((item) => item.id === transactionId);
  if (index === -1) throw new Error("Transaksi tidak ditemukan.");
  const transaction = transactions[index];
  await delay(420);

  const paidAt = new Date().toISOString();
  const paid: PaymentTransaction = { ...transaction, status: "paid", paidAt };
  transactions[index] = paid;
  saveTransactions(transactions);

  setThemeOverride(transaction.params.graveId, transaction.params.selectedTheme);
  const ids = setVipIds([...getVipIds(), transaction.params.graveId]);

  return {
    graveId: transaction.params.graveId,
    ids,
    method: transaction.method,
    receiptId: paid.id,
    paidAt,
    transaction: paid,
  };
}

/** Helper untuk pemanggilan sekali jalan dari provider. */
export async function upgradeToVip(params: CreateCheckoutParams, method: PaymentMethod = params.method ?? "qris"): Promise<VipUpgradeResult> {
  const transaction = await createCheckout(params, method);
  return completeCheckout(transaction.id);
}

/**
 * Saat tema VIP dipilih dari modal kubur, pembayaran terjadi atas draft id.
 * Setelah makam asli dibuat, id tersebut ditukar di semua catatan lokal.
 */
export function replaceVipId(fromId: string, toId: string): string[] {
  if (!fromId || !toId || fromId === toId) return getVipIds();
  const ids = setVipIds(getVipIds().map((id) => (id === fromId ? toId : id)));
  moveThemeOverride(fromId, toId);
  saveTransactions(getTransactions().map((item) => item.params.graveId === fromId
    ? { ...item, params: { ...item.params, graveId: toId, metadata: { ...item.params.metadata, draft: false } } }
    : item));
  return ids;
}

/** Bersihkan status lokal saat makam digali kembali. */
export function releaseVipId(graveId: string): void {
  setVipIds(getVipIds().filter((id) => id !== graveId));
  removeThemeOverride(graveId);
}

export function buildDraftId(): string {
  return `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Makam sementara hanya untuk checkout tema VIP sebelum wacana disimpan. */
export function createDraftGrave(input: CreateMakamInput): Makam {
  return {
    id: buildDraftId(),
    judul: input.judul,
    kategori: input.kategori,
    pembuat: input.pembuat || "Anonim",
    tanggalMulai: input.tanggalMulai,
    tanggalMenyerah: input.tanggalMenyerah,
    penyebab: input.penyebab,
    epitaph: input.epitaph,
    kronologi: input.kronologi ?? "",
    kerugianTeks: input.kerugianTeks ?? "",
    ...(input.kerugianRupiah === undefined ? {} : { kerugianRupiah: input.kerugianRupiah }),
    ...(input.kerugianJam === undefined ? {} : { kerugianJam: input.kerugianJam }),
    bunga: 0,
    tema: input.tema,
    komentar: [],
    createdAt: new Date().toISOString(),
  };
}
