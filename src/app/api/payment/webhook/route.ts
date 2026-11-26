import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isNisanTema } from "@/lib/themes";
import type { NisanTema } from "@/types/graveyard";

interface MidtransNotification {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  fraud_status?: string;
  custom_field1?: string;
  custom_field2?: string;
}

function verifyMidtransSignature(payload: MidtransNotification, serverKey: string): boolean {
  const { order_id, status_code, gross_amount, signature_key } = payload;
  if (!order_id || !status_code || !gross_amount || !signature_key) return false;
  const expected = crypto
    .createHash("sha512")
    .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    .digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(signature_key, "utf8");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

export async function POST(request: Request) {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
    if (!serverKey) {
      return NextResponse.json({ error: "MIDTRANS_SERVER_KEY belum dikonfigurasi." }, { status: 503 });
    }

    const body = (await request.json()) as MidtransNotification;

    if (!verifyMidtransSignature(body, serverKey)) {
      return NextResponse.json({ error: "Signature key Midtrans tidak valid." }, { status: 403 });
    }

    const status = body.transaction_status;
    const fraud = body.fraud_status;
    const isPaid =
      status === "settlement" ||
      (status === "capture" && (!fraud || fraud === "accept"));

    if (!isPaid) {
      return NextResponse.json({ ok: true, ignored: true, transaction_status: status });
    }

    const graveId = body.custom_field1?.trim();
    const selectedTheme: NisanTema = isNisanTema(body.custom_field2) ? body.custom_field2 : "obsidian-emas";

    if (!graveId || graveId.startsWith("draft-")) {
      return NextResponse.json({ ok: true, note: "Draft atau graveId kosong; status VIP diterapkan di klien." });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ ok: true, warning: "Supabase belum dikonfigurasi pada server." });
    }

    const admin = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await admin
      .from("makam")
      .update({ is_vip: true, tema: selectedTheme })
      .eq("id", graveId);

    if (error) {
      console.warn("[midtrans-webhook] Gagal memperbarui tabel makam:", error.message);
      return NextResponse.json({ ok: true, warning: error.message });
    }

    return NextResponse.json({
      ok: true,
      orderId: body.order_id,
      graveId,
      selectedTheme,
      is_vip: true,
    });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Webhook gagal diproses.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
