"use client";

import { useState } from "react";
import { Check, Crown, QrCode, ShieldCheck, Sparkles } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import {
  createPaymentSession,
  payWithMidtransSnap,
  VIP_PRICE,
  type CreateCheckoutParams,
  type PaymentGatewayMode,
  type PaymentMethod,
} from "@/lib/payment";
import { getTemaNisan, isTemaVip, VIP_TEMAS } from "@/lib/themes";
import { formatRupiah } from "@/lib/utils";
import type { NisanTema } from "@/types/graveyard";

export interface CheckoutConfirmPayload {
  selectedTheme: NisanTema;
  orderId: string;
  method: PaymentMethod;
  mode: PaymentGatewayMode;
}

interface CheckoutModalProps {
  params: CreateCheckoutParams;
  onClose: () => void;
  onConfirm: (payload: CheckoutConfirmPayload) => Promise<void>;
}

const BENEFITS = [
  "Pilih salah satu dari 4 material nisan VIP eksklusif",
  "Monumen lebih besar dengan emblem mahkota & aura cahaya",
  "Terlindungi permanen dari erosi 7 hari (Bukit Kehormatan)",
  "Ekspor Story Studio premium tanpa watermark besar",
];

export function CheckoutModal({ params, onClose, onConfirm }: CheckoutModalProps) {
  const initialTheme: NisanTema = isTemaVip(params.selectedTheme) ? params.selectedTheme : "obsidian-emas";
  const [selectedTheme, setSelectedTheme] = useState<NisanTema>(initialTheme);
  const [busy, setBusy] = useState(false);
  const [demoOrderId, setDemoOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const tema = getTemaNisan(selectedTheme);

  async function handlePayNow() {
    setBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const session = await createPaymentSession({
        ...params,
        selectedTheme,
        amount: VIP_PRICE,
      });

      if (session.mode === "demo") {
        setDemoOrderId(session.orderId);
        setStatusMessage("Midtrans server key belum diisi di .env. Gunakan Mode Demo di bawah untuk simulasi offline.");
        return;
      }

      if (!session.token) {
        throw new Error("Token Midtrans Snap tidak ditemukan.");
      }

      const snapOutcome = await payWithMidtransSnap(session.token);
      if (snapOutcome.status === "pending") {
        setStatusMessage(`Menunggu penyelesaian pembayaran (${session.orderId}). Status VIP akan aktif otomatis setelah settlement.`);
        return;
      }

      const paymentType = snapOutcome.result.payment_type ?? "";
      const resolvedMethod: PaymentMethod = paymentType.includes("qris") ? "qris" : "ewallet";
      await onConfirm({
        selectedTheme,
        orderId: snapOutcome.result.order_id || session.orderId,
        method: resolvedMethod,
        mode: "midtrans",
      });
    } catch (reason) {
      setErrorMessage(reason instanceof Error ? reason.message : "Pembayaran belum berhasil diproses.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDemoBypass() {
    if (!demoOrderId) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      await onConfirm({
        selectedTheme,
        orderId: demoOrderId,
        method: "qris",
        mode: "demo",
      });
    } catch (reason) {
      setErrorMessage(reason instanceof Error ? reason.message : "Aktivasi mode demo gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open
      title="Abadikan wacana"
      onClose={onClose}
      className="modal-dialog-wide checkout-dialog"
      footer={
        <div className="checkout-footer-actions">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>Batal</Button>
          <div className="checkout-footer-primary">
            {demoOrderId && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={busy}
                onClick={() => void handleDemoBypass()}
                className="checkout-demo-bypass"
              >
                <Sparkles size={14} aria-hidden="true" />
                Mode Demo (Bypass Bayar)
              </Button>
            )}
            <Button type="button" loading={busy} onClick={() => void handlePayNow()}>
              <ShieldCheck size={16} aria-hidden="true" />
              Bayar Sekarang (QRIS / E-Wallet) — {formatRupiah(VIP_PRICE)}
            </Button>
          </div>
        </div>
      }
    >
      <div className="checkout-content">
        <p className="modal-intro">Satu pembayaran untuk mengunci tema VIP pilihanmu selamanya di Bukit Kehormatan.</p>

        <div className="checkout-grave">
          <span className="checkout-crest" aria-hidden="true"><Crown size={20} strokeWidth={1.5} /></span>
          <div>
            <span>Wacana yang diabadikan</span>
            <strong>{params.graveTitle}</strong>
            <small>Tema terpilih: {tema.label}</small>
          </div>
        </div>

        <fieldset className="checkout-themes">
          <legend>Pilih material nisan VIP</legend>
          <div className="checkout-theme-grid">
            {VIP_TEMAS.map((item) => {
              const active = item.id === selectedTheme;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`checkout-theme-card theme-swatch-${item.id} ${active ? "checkout-theme-card-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => setSelectedTheme(item.id)}
                >
                  <span className="theme-swatch-stone" aria-hidden="true"><Crown size={13} /></span>
                  <span className="checkout-theme-name">{item.label}</span>
                  {active && <Check size={14} className="checkout-theme-check" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </fieldset>

        <ul className="checkout-benefits" aria-label="Keuntungan VIP">
          {BENEFITS.map((benefit) => <li key={benefit}><Check size={14} aria-hidden="true" />{benefit}</li>)}
        </ul>

        <div className="checkout-price">
          <span>Total pembayaran · Midtrans Snap (QRIS, GoPay, ShopeePay, VA)</span>
          <strong>{formatRupiah(VIP_PRICE)}</strong>
        </div>

        <div className="checkout-gateway-badge">
          <QrCode size={16} aria-hidden="true" />
          <span>Pembayaran aman via Midtrans Snap · QRIS, GoPay, ShopeePay, dan Virtual Account.</span>
        </div>

        {statusMessage && (
          <p role="status" className="status-banner">{statusMessage}</p>
        )}

        {errorMessage && (
          <p role="alert" className="status-banner status-banner-danger">{errorMessage}</p>
        )}
      </div>
    </Dialog>
  );
}
