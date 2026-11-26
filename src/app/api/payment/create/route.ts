import { NextResponse } from "next/server";
import { getTemaNisan, isNisanTema } from "@/lib/themes";
import type { NisanTema } from "@/types/graveyard";

interface CreatePaymentBody {
  graveId?: string;
  graveTitle?: string;
  selectedTheme?: string;
  userEmail?: string;
  userName?: string;
  amount?: number;
}

const VIP_AMOUNT = 15_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeMidtransText(value: string, maxLen: number, fallback: string): string {
  const cleaned = value
    .replace(/[^\p{L}\p{N}\s.,\-()]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned || fallback).slice(0, maxLen);
}

function buildMidtransOrderId(graveId: string): string {
  const safeSuffix = graveId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "VIP";
  // Midtrans membatasi order_id maksimal 50 karakter dan hanya alfanumerik, '-', '_'.
  return `GRAVEYARD-${Date.now()}-${safeSuffix}`.slice(0, 50);
}

export async function POST(request: Request) {
  try {
    let body: CreatePaymentBody;
    try {
      body = (await request.json()) as CreatePaymentBody;
    } catch {
      return NextResponse.json({ error: "Payload JSON tidak valid." }, { status: 400 });
    }

    const graveId = typeof body.graveId === "string" ? body.graveId.trim() : "";
    const graveTitle = typeof body.graveTitle === "string" ? body.graveTitle.trim() : "Makam Abadi";
    const selectedTheme: NisanTema = isNisanTema(body.selectedTheme) ? body.selectedTheme : "obsidian-emas";
    const amount = typeof body.amount === "number" && Number.isFinite(body.amount) ? Math.round(body.amount) : VIP_AMOUNT;

    if (!graveId) {
      return NextResponse.json({ error: "graveId wajib diisi." }, { status: 400 });
    }
    if (amount !== VIP_AMOUNT) {
      return NextResponse.json({ error: `Nominal pembayaran VIP harus Rp ${VIP_AMOUNT.toLocaleString("id-ID")}.` }, { status: 400 });
    }

    const orderId = buildMidtransOrderId(graveId);
    const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();

    if (!serverKey) {
      return NextResponse.json(
        { error: "Konfigurasi pembayaran belum aktif di server." },
        { status: 503 },
      );
    }

    const isProduction = process.env.MIDTRANS_IS_PRODUCTION?.trim().toLowerCase() === "true";
    const isSandboxKey = serverKey.startsWith("SB-");
    if (isProduction && isSandboxKey) {
      console.error("[graveyard-payment] Mode production aktif tetapi server key adalah Sandbox (SB-...).");
      return NextResponse.json(
        { error: "Konfigurasi pembayaran belum aktif di server." },
        { status: 503 },
      );
    }
    if (!isProduction && !isSandboxKey && serverKey.startsWith("Mid-server-")) {
      console.error("[graveyard-payment] Mode sandbox aktif tetapi server key adalah Production.");
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

    const rawEmail = typeof body.userEmail === "string" ? body.userEmail.trim() : "";
    const customerEmail = EMAIL_RE.test(rawEmail) ? rawEmail : "peziarah@graveyard.rip";
    const customerName = sanitizeMidtransText(body.userName ?? "", 45, "Peziarah GRAVEYARD");
    const itemName = sanitizeMidtransText(`VIP ${tema.label} - ${graveTitle}`, 50, `VIP ${tema.label}`);

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      item_details: [
        {
          id: selectedTheme,
          price: amount,
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
