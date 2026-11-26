import { moveThemeOverride, removeThemeOverride, setThemeOverride } from "@/lib/themeService";
import { isTemaVip } from "@/lib/themes";
import type { CreateMakamInput, Makam, NisanTema } from "@/types/graveyard";

export const VIP_PRICE = 15_000 as const;
export const VIP_STORAGE_KEY = "wacana-rip:vip";
const TRANSACTION_KEY = "wacana-rip:checkout";

export type PaymentMethod = "qris" | "ewallet";
export type TransactionStatus = "pending" | "paid" | "failed";
export type PaymentGatewayMode = "midtrans" | "demo";

/** Satu-satunya kontrak yang dikirim UI ke lapisan pembayaran. */
export interface CreateCheckoutParams {
  graveId: string;
  graveTitle: string;
  selectedTheme: NisanTema;
  amount: 15000;
  userId?: string;
  userEmail?: string;
  userName?: string;
  method?: PaymentMethod;
  metadata?: { draft?: boolean };
}

export interface PaymentSessionResponse {
  mode: PaymentGatewayMode;
  orderId: string;
  token?: string;
  redirect_url?: string;
}

export interface SnapPayResult {
  order_id?: string;
  transaction_status?: string;
  payment_type?: string;
  status_message?: string;
}

interface MidtransSnapGlobal {
  pay: (
    token: string,
    callbacks: {
      onSuccess?: (result: SnapPayResult) => void;
      onPending?: (result: SnapPayResult) => void;
      onError?: (result: SnapPayResult) => void;
      onClose?: () => void;
    },
  ) => void;
}

declare global {
  interface Window {
    snap?: MidtransSnapGlobal;
  }
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

/** Muat script Midtrans Snap secara dinamis saat dibutuhkan. */
export function loadMidtransSnapScript(): Promise<MidtransSnapGlobal> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Midtrans Snap hanya tersedia di browser."));
  }
  if (window.snap) return Promise.resolve(window.snap);

  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.trim() ?? "";
  const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
  const scriptUrl = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${scriptUrl}"]`);
    if (existing) {
      if (window.snap) { resolve(window.snap); return; }
      existing.addEventListener("load", () => {
        if (window.snap) resolve(window.snap);
        else reject(new Error("Midtrans Snap gagal diinisialisasi."));
      }, { once: true });
      existing.addEventListener("error", () => reject(new Error("Gagal memuat script Midtrans Snap.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = scriptUrl;
    if (clientKey) script.setAttribute("data-client-key", clientKey);
    script.async = true;
    script.onload = () => {
      if (window.snap) resolve(window.snap);
      else reject(new Error("Midtrans Snap tidak tersedia setelah script dimuat."));
    };
    script.onerror = () => reject(new Error("Gagal memuat Midtrans Snap. Periksa koneksi internet."));
    document.head.appendChild(script);
  });
}

/** Buat sesi transaksi ke Next.js API Route (/api/payment/create). */
export async function createPaymentSession(params: CreateCheckoutParams): Promise<PaymentSessionResponse> {
  if (!params.graveId?.trim()) throw new Error("Makam tidak ditemukan.");
  if (params.amount !== VIP_PRICE) throw new Error("Nominal upgrade tidak valid.");

  const response = await fetch("/api/payment/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      graveId: params.graveId,
      graveTitle: params.graveTitle,
      selectedTheme: params.selectedTheme,
      userEmail: params.userEmail,
      userName: params.userName,
      amount: params.amount,
    }),
  });

  const data = (await response.json()) as PaymentSessionResponse & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Gagal memulai sesi pembayaran.");
  }
  return data;
}

/** Buka popup Midtrans Snap dan kembalikan hasil pembayaran. */
export async function payWithMidtransSnap(token: string): Promise<{ status: "success" | "pending"; result: SnapPayResult }> {
  const snap = await loadMidtransSnapScript();
  return new Promise((resolve, reject) => {
    snap.pay(token, {
      onSuccess: (result) => resolve({ status: "success", result }),
      onPending: (result) => resolve({ status: "pending", result }),
      onError: (result) => reject(new Error(result?.status_message || "Pembayaran Midtrans gagal diproses.")),
      onClose: () => reject(new Error("Popup pembayaran ditutup sebelum selesai.")),
    });
  });
}

/** Catat transaksi berhasil & aktifkan tema VIP secara lokal. */
export function recordPaidUpgrade(
  params: CreateCheckoutParams,
  orderId: string,
  method: PaymentMethod = params.method ?? "qris",
): VipUpgradeResult {
  const paidAt = new Date().toISOString();
  const transaction: PaymentTransaction = {
    id: orderId,
    status: "paid",
    method,
    params: { ...params, method },
    createdAt: paidAt,
    paidAt,
  };
  saveTransactions([...getTransactions(), transaction]);
  setThemeOverride(params.graveId, params.selectedTheme);
  const ids = setVipIds([...getVipIds(), params.graveId]);

  return {
    graveId: params.graveId,
    ids,
    method,
    receiptId: orderId,
    paidAt,
    transaction,
  };
}

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
