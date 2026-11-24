"use client";

import { useState, type ReactNode } from "react";
import { Check, Crown, QrCode, ShieldCheck, Wallet } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { VIP_PRICE, type PaymentMethod } from "@/lib/vipService";
import { formatRupiah } from "@/lib/utils";
import type { Makam } from "@/types/graveyard";

interface CheckoutModalProps {
  grave: Makam;
  onClose: () => void;
  onConfirm: (method: PaymentMethod) => Promise<void>;
}

export function CheckoutModal({ grave, onClose, onConfirm }: CheckoutModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("qris");
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try { await onConfirm(method); }
    finally { setBusy(false); }
  }

  return (
    <Dialog open title="Abadikan wacana" onClose={onClose} className="modal-dialog-wide checkout-dialog" footer={<>
      <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
      <Button type="button" loading={busy} onClick={() => void confirm()}><ShieldCheck size={16} aria-hidden="true" />Simulasi Bayar Berhasil</Button>
    </>}>
      <div className="checkout-content">
        <p className="modal-intro">Satu pembayaran, nisan obsidian dan emas selamanya. Erosi berhenti di sini.</p>

        <div className="checkout-grave">
          <span className="checkout-crest" aria-hidden="true"><Crown size={20} strokeWidth={1.5} /></span>
          <div><span>Wacana yang diabadikan</span><strong>{grave.judul}</strong></div>
        </div>

        <div className="checkout-price">
          <span>Total pembayaran</span>
          <strong>{formatRupiah(VIP_PRICE)}</strong>
        </div>

        <fieldset className="checkout-methods">
          <legend>Metode pembayaran</legend>
          <div className="checkout-method-grid">
            <MethodOption value="qris" current={method} onSelect={setMethod} icon={<QrCode size={18} aria-hidden="true" />} label="QRIS" detail="Scan dari aplikasi apa saja" />
            <MethodOption value="ewallet" current={method} onSelect={setMethod} icon={<Wallet size={18} aria-hidden="true" />} label="E-Wallet" detail="GoPay, OVO, DANA" />
          </div>
        </fieldset>

        {method === "qris" && <QrPreview />}

        <p className="checkout-note">Ini simulasi. Tidak ada uang yang ditarik dan tidak ada gateway yang dipanggil.</p>
      </div>
    </Dialog>
  );
}

function MethodOption({ value, current, onSelect, icon, label, detail }: { value: PaymentMethod; current: PaymentMethod; onSelect: (value: PaymentMethod) => void; icon: ReactNode; label: string; detail: string }) {
  const active = value === current;
  return (
    <label className={`checkout-method ${active ? "checkout-method-active" : ""}`}>
      <input type="radio" name="checkout-method" value={value} checked={active} onChange={() => onSelect(value)} />
      <span className="checkout-method-icon" aria-hidden="true">{icon}</span>
      <span className="checkout-method-copy"><strong>{label}</strong><small>{detail}</small></span>
      {active && <Check size={16} className="checkout-method-check" aria-hidden="true" />}
    </label>
  );
}

/** Visual QR statis untuk pratinjau; bukan kode pembayaran sungguhan. */
function QrPreview() {
  const cells = Array.from({ length: 81 }, (_, index) => {
    const x = index % 9;
    const y = Math.floor(index / 9);
    const corner = (x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5);
    return corner ? ((x % 2 === 0 && y % 2 === 0) || (x === 1 && y === 1)) : ((index * 7 + Math.floor(index / 9) * 3) % 5 < 2);
  });
  return (
    <div className="checkout-qr-preview" aria-hidden="true">
      <div className="checkout-qr-grid">{cells.map((filled, index) => <span key={index} className={filled ? "is-filled" : ""} />)}</div>
      <span className="checkout-qr-caption">QRIS · simulasi</span>
    </div>
  );
}
