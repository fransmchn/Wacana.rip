import { removeThemeOverride, setThemeOverride } from "@/lib/themeService";
import type { Makam, NisanTema } from "@/types/graveyard";

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
  userEmail?: string;
  userName?: string;
  method?: PaymentMethod;
  metadata?: { draft?: boolean };
}

export interface PaymentSessionResponse {
  orderId: string;
  token: string;
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
  hide?: () => void;
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

let snapScriptPromise: Promise<MidtransSnapGlobal> | null = null;

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

export function getVipIds(): string[] {
  const parsed = readJson<unknown>(VIP_STORAGE_KEY, []);
  return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
}

function setVipIds(ids: string[]): string[] {
  const unique = Array.from(new Set(ids));
  writeJson(VIP_STORAGE_KEY, unique);
  return unique;
}

/**
 * Satu sumber kebenaran status VIP: flag server/seed (`vip`), ritual 20+ bunga,
 * atau pembelian lokal yang terverifikasi (`ids`). Tema saja tidak pernah meloloskan paywall.
 */
export function isVipMakam(
  makam: Pick<Makam, "id" | "vip" | "bunga" | "tema">,
  ids: string[] = getVipIds(),
): boolean {
  return Boolean(makam.vip) || makam.bunga >= 20 || ids.includes(makam.id);
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
 * Muat script Midtrans Snap secara aman dengan singleton Promise + timeout guard
 * agar tidak terjadi race condition saat window.snap.pay() dipanggil.
 */
export function loadMidtransSnapScript(): Promise<MidtransSnapGlobal> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Jendela pembayaran hanya tersedia di browser."));
  }
  if (window.snap && typeof window.snap.pay === "function") {
    return Promise.resolve(window.snap);
  }
  if (snapScriptPromise) return snapScriptPromise;

  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.trim() ?? "";
  if (!clientKey) {
    return Promise.reject(
      new Error("Konfigurasi pembayaran belum aktif. Silakan coba lagi nanti."),
    );
  }

  const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION?.trim().toLowerCase() === "true";
  const scriptUrl = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  snapScriptPromise = new Promise<MidtransSnapGlobal>((resolve, reject) => {
    const finish = (snap?: MidtransSnapGlobal, error?: Error) => {
      window.clearTimeout(timeoutId);
      if (snap) {
        resolve(snap);
      } else {
        snapScriptPromise = null;
        reject(error ?? new Error("Gagal memuat jendela pembayaran. Pastikan koneksi internet stabil."));
      }
    };

    const timeoutId = window.setTimeout(() => {
      finish(undefined, new Error("Waktu muat jendela pembayaran habis. Pastikan koneksi internet stabil lalu coba lagi."));
    }, 12_000);

    const resolveIfReady = () => {
      if (window.snap && typeof window.snap.pay === "function") {
        finish(window.snap);
        return true;
      }
      return false;
    };

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${scriptUrl}"]`);
    if (existing) {
      if (resolveIfReady()) return;
      existing.addEventListener("load", () => {
        if (!resolveIfReady()) finish(undefined, new Error("Gagal memuat jendela pembayaran. Pastikan koneksi internet stabil."));
      }, { once: true });
      existing.addEventListener("error", () => {
        existing.remove();
        finish(undefined, new Error("Gagal memuat jendela pembayaran. Pastikan koneksi internet stabil."));
      }, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;
    script.onload = () => {
      if (!resolveIfReady()) finish(undefined, new Error("Gagal memuat jendela pembayaran. Pastikan koneksi internet stabil."));
    };
    script.onerror = () => {
      script.remove();
      finish(undefined, new Error("Gagal memuat jendela pembayaran. Pastikan koneksi internet stabil."));
    };
    document.head.appendChild(script);
  });

  return snapScriptPromise;
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

  const data = (await response.json()) as Partial<PaymentSessionResponse> & { error?: string };
  if (!response.ok || !data.token || !data.orderId) {
    throw new Error(data.error || "Gagal memulai sesi pembayaran.");
  }
  return { token: data.token, orderId: data.orderId, redirect_url: data.redirect_url };
}

/** Buka jendela pembayaran dan kembalikan hasil transaksi. */
export async function payWithMidtransSnap(
  token: string,
  options?: { onBeforeOpen?: () => void },
): Promise<{ status: "success" | "pending" | "closed"; result?: SnapPayResult }> {
  const snap = await loadMidtransSnapScript();
  options?.onBeforeOpen?.();
  return new Promise((resolve, reject) => {
    snap.pay(token, {
      onSuccess: (result) => resolve({ status: "success", result }),
      onPending: (result) => resolve({ status: "pending", result }),
      onError: () => reject(new Error("Pembayaran belum berhasil diproses. Silakan coba lagi.")),
      onClose: () => resolve({ status: "closed" }),
    });
  });
}

/** Sinkronkan status VIP & tema dari event Supabase Realtime (webhook) ke cache lokal. */
export function syncVipStatusLocally(graveId: string, selectedTheme?: NisanTema): string[] {
  if (!graveId) return getVipIds();
  if (selectedTheme) setThemeOverride(graveId, selectedTheme);
  return setVipIds([...getVipIds(), graveId]);
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

/** Bersihkan status lokal saat makam digali kembali. */
export function releaseVipId(graveId: string): void {
  setVipIds(getVipIds().filter((id) => id !== graveId));
  removeThemeOverride(graveId);
}
