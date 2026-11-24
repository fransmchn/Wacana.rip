"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { Makam } from "@/types/graveyard";

interface DigUpConfirmModalProps {
  makam: Makam;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DigUpConfirmModal({ makam, onClose, onConfirm }: DigUpConfirmModalProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
      toast("Wacana berhasil digali kembali.", "success");
      onClose();
    } catch (reason) {
      toast(reason instanceof Error ? reason.message : "Makam gagal digali.", "danger");
    } finally { setBusy(false); }
  }

  return (
    <Dialog open title="Gali kembali" onClose={onClose} className="modal-dialog-wide" footer={<>
      <Button type="button" variant="ghost" onClick={onClose}>Biarkan tetap di sini</Button>
      <Button type="button" variant="danger" loading={busy} onClick={() => void confirm()}>Ya, gali kembali</Button>
    </>}>
      <div className="dig-up-confirm">
        <span className="dig-up-symbol" aria-hidden="true"><TriangleAlert size={26} strokeWidth={1.5} /></span>
        <h3>Yakin ingin menggali kembali wacana ini?</h3>
        <p><strong>{makam.judul}</strong> akan dihapus dari pemakaman. Bunga, lilin, dan doa yang menyertainya ikut hilang. Tindakan ini tidak bisa dibatalkan.</p>
      </div>
    </Dialog>
  );
}
