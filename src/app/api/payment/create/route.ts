import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getTemaNisan, isNisanTema, isTemaVip } from "@/lib/themes";
import type { NisanTema } from "@/types/graveyard";

interface CreatePaymentBody {
  graveId?: unknown;
  graveTitle?: unknown;
  selectedTheme?: unknown;
  userEmail?: unknown;
  userName?: unknown;
}

/** Harga VIP dikunci ketat di server (IDR) — tidak pernah mempercayai `amount` dari klien. */
const SERVER_VIP_PRICE_IDR = 15_000;
const GRAVE_ID_RE = /^[a-zA-Z0-9_-]{4,64}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizePaymentText(value: unknown, maxLen: number, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const cleaned = value
    .replace(/<[^>]*>/g, " ")
    .replace(/[^\p{L}\p{N}\s.,\-()]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned || fallback).slice(0, maxLen);
}

function buildOrderId(graveId: string): string {
  const safeSuffix = graveId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "VIP";
  // Batas maksimum order_id gateway adalah 50 karakter alfanumerik/'-'/'_'.
  return `GRAVEYARD-${Date.now()}-${safeSuffix}`.slice(0, 50);
}

export async function POST(request: Request) {
  try {
    // Rate limit per IP: maksimal 12 permintaan sesi pembayaran per menit
    const ip = getClientIp(request);
    const rate = checkRateLimit(`pay-create:${ip}`, 12, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan pembayaran. Tunggu sebentar lalu coba lagi." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }

    let body: CreatePaymentBody;
    try {
      body = (await request.json()) as CreatePaymentBody;
    } catch {
      return NextResponse.json({ error: "Payload JSON tidak valid." }, { status: 400 });
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
    }

    const graveId = typeof body.graveId === "string" ? body.graveId.trim() : "";
    if (!GRAVE_ID_RE.test(graveId)) {
      return NextResponse.json({ error: "Identitas makam tidak valid." }, { status: 400 });
    }

    // Validasi whitelist tema VIP
    if (!isNisanTema(body.selectedTheme) || !isTemaVip(body.selectedTheme)) {
      return NextResponse.json({ error: "Tema VIP yang dipilih tidak valid." }, { status: 400 });
    }
    const selectedTheme: NisanTema = body.selectedTheme;

    const graveTitle = sanitizePaymentText(body.graveTitle, 120, "Makam Abadi");
    const orderId = buildOrderId(graveId);
    const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();

    if (!serverKey) {
      return NextResponse.json(
        { error: "Konfigurasi pembayaran belum aktif di server." },
        { status: 503 },
      );
    }

    const isProduction = process.env.MIDTRANS_IS_PRODUCTION?.trim().toLowerCase() === "true";
    const isSandboxKey = serverKey.startsWith("SB-");
    if ((isProduction && isSandboxKey) || (!isProduction && !isSandboxKey && serverKey.startsWith("Mid-server-"))) {
      console.error("[graveyard-payment] Ketidakcocokan mode sandbox/production dengan server key.");
      return NextResponse.json(
        { error: "Konfigurasi pembayaran belum aktif di server." },
        { status: 503 },
      );
    }

    const snapUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const tema = getTemaNisan(selectedTheme);
    const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;

    const rawEmail = typeof body.userEmail === "string" ? body.userEmail.trim().slice(0, 120) : "";
    const customerEmail = EMAIL_RE.test(rawEmail) ? rawEmail : "peziarah@graveyard.rip";
    const customerName = sanitizePaymentText(body.userName, 45, "Peziarah GRAVEYARD");
    const itemName = sanitizePaymentText(`VIP ${tema.label} - ${graveTitle}`, 50, `VIP ${tema.label}`);

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: SERVER_VIP_PRICE_IDR,
      },
      item_details: [
        {
          id: selectedTheme,
          price: SERVER_VIP_PRICE_IDR,
          quantity: 1,
          name: itemName,
        },
      ],
      customer_details: {
        first_name: customerName,
        email: customerEmail,
      },
      custom_field1: graveId,
      custom_field2: selectedTheme,
      enabled_payments: [
        "other_qris",
        "gopay",
        "shopeepay",
        "bca_va",
        "bni_va",
        "bri_va",
        "echannel",
        "permata_va",
        "cimb_va",
      ],
    };

    const response = await fetch(snapUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    let data: { token?: string; redirect_url?: string; error_messages?: string[]; status_message?: string } = {};
    try {
      data = JSON.parse(rawText) as typeof data;
    } catch {
      /* non-JSON response */
    }

    if (!response.ok || !data.token) {
      const detail =
        data.error_messages?.join("; ") ||
        data.status_message ||
        `HTTP ${response.status}`;
      console.error("[graveyard-payment] Gateway error:", response.status, detail);
      return NextResponse.json(
        { error: "Gerbang pembayaran belum dapat memproses transaksi. Silakan coba lagi." },
        { status: response.status >= 400 && response.status < 500 ? response.status : 502 },
      );
    }

    return NextResponse.json({
      token: data.token,
      redirect_url: data.redirect_url,
      orderId,
    });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Gagal membuat transaksi pembayaran.";
    console.error("[graveyard-payment] Create route exception:", message);
    return NextResponse.json({ error: "Terjadi kesalahan saat menyiapkan gerbang pembayaran." }, { status: 500 });
  }
}
