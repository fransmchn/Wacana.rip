"use client";

import { useRef, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { toPng } from "html-to-image";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { Makam } from "@/types/graveyard";
import { formatKerugian, formatTanggal, getDurasiHari, getLabelDurasi } from "@/lib/utils";

// Static values intentionally kept for certificate PNG export.
const certificatePalette = { ink: "#f4f1e9", muted: "#a7a69f", gold: "#d8ad69", paper: "#211c1c", border: "#d8ad69" };

export function DeathCertificateModal({ makam, onClose }: { makam: Makam; onClose: () => void }) {
  const { toast } = useToast();
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);

  async function renderCertificate() {
    if (!ref.current) throw new Error("Pratinjau sertifikat belum siap.");
    return toPng(ref.current, { pixelRatio: 2, cacheBust: true });
  }
  async function download() {
    setBusy("download");
    try { const dataUrl = await renderCertificate(); const link = document.createElement("a"); link.download = `sertifikat-${makam.id.slice(-8)}.png`; link.href = dataUrl; link.click(); toast("Sertifikat berhasil diunduh.", "success"); }
    catch { toast("Sertifikat gagal dibuat. Coba lagi.", "danger"); }
    finally { setBusy(null); }
  }
  async function share() {
    setBusy("share");
    try {
      const dataUrl = await renderCertificate();
      if (!navigator.share) { const link = document.createElement("a"); link.download = `sertifikat-${makam.id.slice(-8)}.png`; link.href = dataUrl; link.click(); toast("Peramban belum mendukung bagikan. Sertifikat diunduh.", "info"); return; }
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `sertifikat-${makam.id.slice(-8)}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ title: "Sertifikat Wacana", text: `Sertifikat untuk ${makam.judul}`, files: [file] });
      else await navigator.share({ title: "Sertifikat Wacana", text: `Sertifikat untuk ${makam.judul}` });
      toast("Sertifikat berhasil dibagikan.", "success");
    } catch (reason) { if ((reason as DOMException)?.name !== "AbortError") toast("Sertifikat belum bisa dibagikan. Coba lagi.", "danger"); }
    finally { setBusy(null); }
  }

  return <Dialog open title="Sertifikat kematian" onClose={onClose} className="certificate-dialog"><div className="certificate-content"><div ref={ref} className="certificate-card" style={{ color: certificatePalette.ink, backgroundColor: certificatePalette.paper, borderColor: certificatePalette.border }}><div className="certificate-card-header"><div><p className="certificate-kicker" style={{ color: certificatePalette.gold }}>Wacana.rip · TPU Wacana</p><h3>Sertifikat Kematian</h3></div><span>#{makam.id.slice(-8).toUpperCase()}</span></div><p className="certificate-title">{makam.judul}</p><p className="certificate-subtitle">dinyatakan gugur dengan hormat</p><dl><div><dt>Pembuat</dt><dd>{makam.pembuat}</dd></div><div><dt>Penyebab</dt><dd>{makam.penyebab}</dd></div><div><dt>Lahir</dt><dd>{formatTanggal(makam.tanggalMulai)}</dd></div><div><dt>Gugur</dt><dd>{formatTanggal(makam.tanggalMenyerah)}</dd></div><div><dt>Masa hidup</dt><dd>{getLabelDurasi(getDurasiHari(makam.tanggalMulai, makam.tanggalMenyerah))}</dd></div><div><dt>Kerugian</dt><dd>{formatKerugian(makam)}</dd></div></dl><p className="certificate-epitaph" style={{ color: certificatePalette.gold }}>“{makam.epitaph}”</p></div><div className="modal-footer"><Button loading={busy === "download"} disabled={Boolean(busy)} onClick={() => void download()}><Download size={16} aria-hidden="true" />Download</Button><Button variant="secondary" loading={busy === "share"} disabled={Boolean(busy)} onClick={() => void share()}><Share2 size={16} aria-hidden="true" />Bagikan</Button></div></div></Dialog>;
}
