"use client";

import { useState, type FormEvent } from "react";
import { Crown, Flower2, Hourglass, MessageCircle, Sparkles } from "lucide-react";
import { FlowerBurst } from "@/components/FlowerBurst";
import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Tooltip } from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/Toast";
import { resolveTheme } from "@/lib/themeService";
import { getTemaNisan } from "@/lib/themes";
import type { KomentarInput, Makam } from "@/types/graveyard";
import type { ErosionInfo } from "@/lib/utils";
import { formatKerugian, formatTanggal, getDurasiHari, getLabelDurasi } from "@/lib/utils";

const categoryLabel: Record<Makam["kategori"], string> = { skripsi: "Skripsi", koding: "Koding", desain: "Desain", bisnis: "Bisnis", resolusi: "Resolusi", hubungan: "Hubungan", pribadi: "Pribadi", pekerjaan: "Pekerjaan", keluarga: "Keluarga", kesehatan: "Kesehatan", perjalanan: "Perjalanan", lainnya: "Lainnya" };

interface GraveDetailModalProps {
  makam: Makam;
  onClose: () => void;
  onFlower: (id: string) => void;
  onComment: (id: string, input: KomentarInput) => Promise<void>;
  flowerStatus: "active" | "done" | "login";
  flowerCountdown?: string;
  vip: boolean;
  erosion: ErosionInfo;
  onUpgrade: (makam: Makam) => void;
  onOpenStory: (makam: Makam) => void;
}

export function GraveDetailModal({ makam, onClose, onFlower, onComment, flowerStatus, flowerCountdown, vip, erosion, onUpgrade, onOpenStory }: GraveDetailModalProps) {
  const { toast } = useToast();
  const [input, setInput] = useState<KomentarInput>({ nama: "", isi: "" });
  const [saving, setSaving] = useState(false);
  const [flowerBurst, setFlowerBurst] = useState(false);
  const tema = getTemaNisan(resolveTheme(makam));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!input.isi.trim()) { toast("Tulis doa atau curhat dulu.", "danger"); return; }
    setSaving(true);
    try { await onComment(makam.id, input); setInput({ nama: "", isi: "" }); toast("Belasungkawa terkirim.", "success"); }
    catch (reason) { toast(reason instanceof Error ? reason.message : "Komentar belum bisa dikirim.", "danger"); }
    finally { setSaving(false); }
  }

  function handleFlower() { if (flowerStatus === "active") setFlowerBurst(true); onFlower(makam.id); }

  return (
    <Dialog open title="Inspeksi Monumen" onClose={onClose} backdropClassName="inspection-backdrop" className={`inspection-dialog grave-detail-dialog ${vip ? "grave-detail-dialog-vip" : ""}`}>
      <div className="grave-detail-content">
        <div className={`inspection-plaque tombstone-theme-${tema.id}`} aria-hidden="true">
          <span className="inspection-plaque-glow" />
          <span className="inspection-plaque-stone">
            <span className="inspection-plaque-cap" />
            {vip && <Sparkles className="inspection-plaque-crest" size={18} strokeWidth={1.4} />}
            <span className="inspection-plaque-rip">RIP</span>
            <span className="inspection-plaque-name" data-truncate="true">{makam.judul.slice(0, 42)}</span>
            <span className="inspection-plaque-years">{makam.tanggalMulai.slice(0, 4)} — {makam.tanggalMenyerah.slice(0, 4)}</span>
          </span>
          <span className="inspection-plaque-base" />
        </div>
        <div className="grave-detail-heading">
          <div>
            <div className="grave-detail-badges">
              <Badge tone={vip ? "gold" : "neutral"}>{categoryLabel[makam.kategori]}</Badge>
              <Badge tone={vip ? "gold" : "neutral"}><Sparkles size={11} aria-hidden="true" />{tema.label}</Badge>
              {vip && <Badge tone="gold"><Crown size={11} aria-hidden="true" /> Abadi</Badge>}
              <span className="grave-detail-date">{formatTanggal(makam.tanggalMenyerah)}</span>
            </div>
            <h3 className="grave-detail-title">{makam.judul}</h3>
            <p className="grave-detail-life">Hidup {getLabelDurasi(getDurasiHari(makam.tanggalMulai, makam.tanggalMenyerah))}</p>
          </div>
        </div>

        <div className={`grave-condition ${vip ? "grave-condition-vip" : ""}`}>
          {vip ? (
            <p><Crown size={15} aria-hidden="true" /> Makam Abadi · {tema.label}, terlindungi dari erosi.</p>
          ) : (
            <>
              <div className="grave-condition-meta"><span><Hourglass size={13} aria-hidden="true" /> {erosion.label}</span><span>{erosion.progress}% erosi</span></div>
              <div className="erosion-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={erosion.progress} aria-label={erosion.label}><span style={{ width: `${erosion.progress}%` }} /></div>
            </>
          )}
        </div>

        <div className="grave-detail-meta"><div><span>Pembuat</span><strong>{makam.pembuat}</strong></div><div><span>Dimulai</span><strong>{formatTanggal(makam.tanggalMulai)}</strong></div><div><span>Kerugian</span><strong>{formatKerugian(makam)}</strong></div></div>
        <section className="grave-detail-section"><h3>Penyebab gugur</h3><p>{makam.penyebab}</p></section>
        <p className="grave-detail-epitaph">“{makam.epitaph}”</p>
        {makam.kronologi.trim() && <section className="grave-detail-section"><h3>Kronologi</h3><p>{makam.kronologi}</p></section>}
        <div className="grave-detail-actions">
          <FlowerBurst active={flowerBurst} onDone={() => setFlowerBurst(false)} />
          <Tooltip label={flowerStatus === "done" ? `Bisa menabur lagi dalam ${flowerCountdown ?? "..."}` : flowerStatus === "login" ? "Masuk untuk menabur bunga" : "Tabur bunga"}>
            <Button disabled={flowerStatus === "done"} onClick={handleFlower}><Flower2 size={16} aria-hidden="true" /><span>{flowerStatus === "login" ? "Masuk untuk menabur" : flowerStatus === "done" ? `Besok lagi · ${flowerCountdown ?? "..."}` : `Tabur bunga · ${makam.bunga}`}</span></Button>
          </Tooltip>
          <Button variant="secondary" aria-label="Story Studio" onClick={() => onOpenStory(makam)}><Sparkles size={16} aria-hidden="true" /><span>Story Studio</span></Button>
        </div>

        {!vip && (
          <section className="upgrade-panel" aria-labelledby="upgrade-title">
            <span className="upgrade-emblem" aria-hidden="true"><Crown size={22} strokeWidth={1.5} /></span>
            <div className="upgrade-copy">
              <h3 id="upgrade-title">Upgrade ke Makam Abadi</h3>
              <p>Buka keempat tema premium, perbesar monumen, dan hentikan erosi permanen.</p>
            </div>
            <Button variant="secondary" onClick={() => onUpgrade(makam)}><Crown size={15} aria-hidden="true" />Upgrade ke Makam Abadi</Button>
          </section>
        )}

        <section className="grave-comments" aria-labelledby="comments-title"><div className="grave-comments-heading"><h3 id="comments-title"><MessageCircle size={17} aria-hidden="true" />Pesan Belasungkawa</h3><span>{makam.komentar.length}</span></div>{makam.komentar.length ? <div className="grave-comment-list">{makam.komentar.map((comment) => <article className="grave-comment" key={comment.id}><Avatar name={comment.nama} size="sm" /><div><div className="grave-comment-meta"><strong>{comment.nama}</strong><time dateTime={comment.createdAt}>{relativeTime(comment.createdAt)}</time></div><p>{comment.isi}</p></div></article>)}</div> : <EmptyState title="Belum ada doa" description="Jadilah yang pertama meninggalkan jejak." icon={<MessageCircle size={18} aria-hidden="true" />} />}</section>
        <form className="grave-comment-form" onSubmit={submit}><Textarea label="Tinggalkan doa atau curhat" value={input.isi} maxLength={280} onChange={(event) => setInput((current) => ({ ...current, isi: event.target.value }))} helperText={`${input.isi.length}/280`} placeholder="Semoga wacana ini beristirahat dengan tenang." /><InputName value={input.nama ?? ""} onChange={(value) => setInput((current) => ({ ...current, nama: value }))} /><Button type="submit" loading={saving}><MessageCircle size={16} aria-hidden="true" />Kirim belasungkawa</Button></form>
      </div>
    </Dialog>
  );
}

function InputName({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <Input label="Nama" helperText="Opsional" maxLength={30} value={value} onChange={(event) => onChange(event.target.value)} placeholder="Anonim" />; }
function relativeTime(value: string): string { const seconds = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000); if (seconds < 60) return "baru saja"; const minutes = Math.floor(seconds / 60); if (minutes < 60) return `${minutes} menit lalu`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours} jam lalu`; const days = Math.floor(hours / 24); return days < 30 ? `${days} hari lalu` : formatTanggal(value); }
