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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePaymentBody;
    const graveId = typeof body.graveId === "string" ? body.graveId.trim() : "";
    const graveTitle = typeof body.graveTitle === "string" ? body.graveTitle.trim() : "Makam Abadi";
    const selectedTheme: NisanTema = isNisanTema(body.selectedTheme) ? body.selectedTheme : "obsidian-emas";
    const amount = typeof body.amount === "number" && body.amount > 0 ? Math.round(body.amount) : VIP_AMOUNT;

    if (!graveId) {
      return NextResponse.json({ error: "graveId wajib diisi." }, { status: 400 });
    }
    if (amount !== VIP_AMOUNT) {
      return NextResponse.json({ error: "Nominal pembayaran VIP harus Rp 15.000." }, { status: 400 });
    }

    const safeSuffix = graveId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6) || "VIP";
    const orderId = `GRAVEYARD-${Date.now()}-${safeSuffix}`;

    const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
    if (!serverKey) {
      return NextResponse.json({
        mode: "demo" as const,
        orderId,
      });
    }

    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const snapUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const tema = getTemaNisan(selectedTheme);
    const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;

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
          name: `VIP ${tema.label} - ${graveTitle}`.slice(0, 50),
        },
      ],
      customer_details: {
        first_name: (body.userName?.trim() || "Peziarah GRAVEYARD").slice(0, 50),
        email: body.userEmail?.trim() || "peziarah@graveyard.rip",
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

    const data = (await response.json()) as {
      token?: string;
      redirect_url?: string;
      error_messages?: string[];
    };

    if (!response.ok || !data.token) {
      const detail = data.error_messages?.join(", ") || "Midtrans menolak permintaan transaksi.";
      return NextResponse.json({ error: detail }, { status: 502 });
    }

    return NextResponse.json({
      mode: "midtrans" as const,
      token: data.token,
      redirect_url: data.redirect_url,
      orderId,
    });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Gagal membuat transaksi pembayaran.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
