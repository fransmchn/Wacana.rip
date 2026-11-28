"use client";

import { useState, type FormEvent, type ReactElement } from "react";
import { Award, Crown, Flower2, Hourglass, Lock, LockOpen, MessageCircle, Sparkles } from "lucide-react";
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
import { getTemaNisan, VIP_TEMAS } from "@/lib/themes";
import { addMonthsIso, getCapsuleStatus, getTimeCapsule, saveTimeCapsule, type TimeCapsule } from "@/lib/timeCapsuleService";
import { getCertificateSerial } from "@/lib/storyCanvas";
import type { KomentarInput, Makam, NisanTema } from "@/types/graveyard";
import type { ErosionInfo } from "@/lib/utils";
import { formatKerugian, formatTanggal, getDurasiHari, getLabelDurasi } from "@/lib/utils";

const categoryLabel: Record<Makam["kategori"], string> = {
  skripsi: "Skripsi", koding: "Koding", desain: "Desain", bisnis: "Bisnis", resolusi: "Resolusi",
  hubungan: "Hubungan", pribadi: "Pribadi", pekerjaan: "Pekerjaan", keluarga: "Keluarga",
  kesehatan: "Kesehatan", perjalanan: "Perjalanan", lainnya: "Lainnya",
};

const VIP_EMBERS = [
  { left: "16%", delay: "0s", duration: "4.6s" },
  { left: "28%", delay: "-1.4s", duration: "5.4s" },
  { left: "44%", delay: "-2.8s", duration: "4.2s" },
  { left: "62%", delay: "-0.8s", duration: "5.1s" },
  { left: "76%", delay: "-2.1s", duration: "4.8s" },
  { left: "86%", delay: "-3.2s", duration: "5.6s" },
];

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
  onSwitchVipTheme?: (makam: Makam, tema: NisanTema) => Promise<void> | void;
  canEditVip?: boolean;
}

export function GraveDetailModal({
  makam,
  onClose,
  onFlower,
  onComment,
  flowerStatus,
  flowerCountdown,
  vip,
  erosion,
  onUpgrade,
  onOpenStory,
  onSwitchVipTheme,
  canEditVip = false,
}: GraveDetailModalProps): ReactElement | null {
  const { toast } = useToast();
  const [input, setInput] = useState<KomentarInput>({ nama: "", isi: "" });
  const [saving, setSaving] = useState(false);
  const [flowerBurst, setFlowerBurst] = useState(false);
  const [capsule, setCapsule] = useState<TimeCapsule | null>(() => (makam ? getTimeCapsule(makam) : null));
  const [capsuleDraft, setCapsuleDraft] = useState("");
  const [capsuleDate, setCapsuleDate] = useState(() => addMonthsIso(6));
  const [capsuleOpenForm, setCapsuleOpenForm] = useState(false);
  const [capsuleSaving, setCapsuleSaving] = useState(false);
  const [capsuleUnsealed, setCapsuleUnsealed] = useState(false);
  const [switchingTheme, setSwitchingTheme] = useState(false);

  if (!makam) return null;

  const tema = getTemaNisan(resolveTheme(makam));
  const serial = getCertificateSerial(makam.id);
  const capsuleStatus = capsule ? getCapsuleStatus(capsule) : null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!input.isi.trim()) { toast("Tulis doa atau curhat dulu.", "danger"); return; }
    setSaving(true);
    try { await onComment(makam.id, input); setInput({ nama: "", isi: "" }); toast("Belasungkawa terkirim.", "success"); }
    catch (reason) { toast(reason instanceof Error ? reason.message : "Komentar belum bisa dikirim.", "danger"); }
    finally { setSaving(false); }
  }

  async function handleSealCapsule(event: FormEvent) {
    event.preventDefault();
    if (!capsuleDraft.trim()) { toast("Tulis pesan kebangkitan terlebih dahulu.", "danger"); return; }
    setCapsuleSaving(true);
    try {
      const saved = await saveTimeCapsule(makam.id, capsuleDraft, capsuleDate);
      setCapsule(saved);
      setCapsuleDraft("");
      setCapsuleOpenForm(false);
      toast(`Kapsul waktu disegel hingga ${formatTanggal(saved.unlockAt)}.`, "success");
    } catch (reason) {
      toast(reason instanceof Error ? reason.message : "Gagal menyegel kapsul waktu.", "danger");
    } finally {
      setCapsuleSaving(false);
    }
  }

  async function handleThemeSwap(nextTheme: NisanTema) {
    if (!onSwitchVipTheme || nextTheme === tema.id) return;
    setSwitchingTheme(true);
    try {
      await onSwitchVipTheme(makam, nextTheme);
      toast(`Material monumen diganti ke ${getTemaNisan(nextTheme).label}.`, "success");
    } catch (reason) {
      toast(reason instanceof Error ? reason.message : "Gagal mengganti material.", "danger");
    } finally {
      setSwitchingTheme(false);
    }
  }

  function handleFlower() { if (flowerStatus === "active") setFlowerBurst(true); onFlower(makam.id); }

  return (
    <Dialog open title="Inspeksi Monumen" onClose={onClose} backdropClassName="inspection-backdrop" className={`inspection-dialog grave-detail-dialog ${vip ? "grave-detail-dialog-vip" : ""}`}>
      <div className="grave-detail-content">
        <div className={`inspection-plaque tombstone-theme-${tema.id} ${vip ? "inspection-plaque-vip" : ""}`} aria-hidden="true">
          <span className="inspection-plaque-glow" />
          {vip && (
            <div className="vip-embers">
              {VIP_EMBERS.map((ember, idx) => (
                <i
                  key={idx}
                  className="vip-ember"
                  style={{ left: ember.left, animationDelay: ember.delay, animationDuration: ember.duration }}
                />
              ))}
            </div>
          )}
          <span className="inspection-plaque-stone">
            <span className="inspection-plaque-cap" />
            {vip && <Crown className="inspection-plaque-crest" size={18} strokeWidth={1.6} />}
            <span className="inspection-plaque-rip">RIP</span>
            <span className="inspection-plaque-name" data-truncate="true">{makam.judul.slice(0, 42)}</span>
            <span className="inspection-plaque-years">{makam.tanggalMulai.slice(0, 4)} — {makam.tanggalMenyerah.slice(0, 4)}</span>
          </span>
          {vip && (
            <>
              <span className="vip-candle vip-candle-left"><span className="vip-candle-flame" /></span>
              <span className="vip-candle vip-candle-right"><span className="vip-candle-flame" /></span>
            </>
          )}
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
            <p className="grave-detail-life">Hidup {getLabelDurasi(getDurasiHari(makam.tanggalMulai, makam.tanggalMenyerah))}{vip ? ` · Arsip ${serial}` : ""}</p>
          </div>
        </div>

        <div className={`grave-condition ${vip ? "grave-condition-vip" : ""}`}>
          {vip ? (
            <p><Crown size={15} aria-hidden="true" /> Monumen Abadi · {tema.label}, terlindungi permanen di Bukit Kehormatan.</p>
          ) : (
            <>
              <div className="grave-condition-meta"><span><Hourglass size={13} aria-hidden="true" /> {erosion.label}</span><span>{erosion.progress}% erosi</span></div>
              <div className="erosion-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={erosion.progress} aria-label={erosion.label}><span style={{ width: `${erosion.progress}%` }} /></div>
            </>
          )}
        </div>

        {vip && canEditVip && onSwitchVipTheme && (
          <section className="vip-material-bar" aria-label="Ganti material VIP">
            <span className="vip-material-label">Material VIP (bebas ganti):</span>
            <div className="vip-material-pills">
              {VIP_TEMAS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={switchingTheme}
                  className={`vip-material-pill theme-swatch-${item.id} ${tema.id === item.id ? "vip-material-pill-active" : ""}`}
                  aria-pressed={tema.id === item.id}
                  onClick={() => void handleThemeSwap(item.id)}
                >
                  <span className="vip-material-dot" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="grave-detail-meta">
          <div><span>Pembuat</span><strong>{makam.pembuat}</strong></div>
          <div><span>Dimulai</span><strong>{formatTanggal(makam.tanggalMulai)}</strong></div>
          <div><span>Kerugian</span><strong>{formatKerugian(makam)}</strong></div>
        </div>
        <section className="grave-detail-section"><h3>Penyebab gugur</h3><p>{makam.penyebab}</p></section>
        <p className="grave-detail-epitaph">“{makam.epitaph}”</p>
        {makam.kronologi.trim() && <section className="grave-detail-section"><h3>Kronologi</h3><p>{makam.kronologi}</p></section>}

        <div className="grave-detail-actions">
          <FlowerBurst active={flowerBurst} onDone={() => setFlowerBurst(false)} />
          <Tooltip label={flowerStatus === "done" ? `Bisa menabur lagi dalam ${flowerCountdown ?? "..."}` : flowerStatus === "login" ? "Masuk untuk menabur bunga" : "Tabur bunga"}>
            <Button disabled={flowerStatus === "done"} onClick={handleFlower}>
              <Flower2 size={16} aria-hidden="true" />
              <span>{flowerStatus === "login" ? "Masuk untuk menabur" : flowerStatus === "done" ? `Besok lagi · ${flowerCountdown ?? "..."}` : `Tabur bunga · ${makam.bunga}`}</span>
            </Button>
          </Tooltip>
          <Button variant="secondary" aria-label="Story Studio" onClick={() => onOpenStory(makam)}>
            {vip ? <Award size={16} aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
            <span>{vip ? "Story & Akta Resmi" : "Story Studio"}</span>
          </Button>
        </div>

        {/* VIP Exclusive: Kapsul Waktu / Pesan Kebangkitan */}
        {vip && (
          <section className="capsule-panel" aria-labelledby="capsule-title">
            <div className="capsule-head">
              <div>
                <h3 id="capsule-title"><Lock size={14} aria-hidden="true" /> Kapsul Waktu · Pesan Kebangkitan</h3>
                <p>Pesan rahasia tersegel lilin emas yang hanya bisa dibuka pada tanggal kebangkitan.</p>
              </div>
              {!capsule && !capsuleOpenForm && (
                <Button size="sm" variant="secondary" onClick={() => setCapsuleOpenForm(true)}>Tulis Kapsul</Button>
              )}
            </div>

            {capsule && capsuleStatus && capsuleStatus.locked && (
              <div className="capsule-sealed-plaque" role="status">
                <span className="capsule-wax-seal" aria-hidden="true"><Lock size={16} /></span>
                <div>
                  <strong>Tersegel · Terbuka dalam {capsuleStatus.daysLeft} hari</strong>
                  <small>Segel akan terbuka otomatis pada {capsuleStatus.unlockLabel}</small>
                </div>
              </div>
            )}

            {capsule && capsuleStatus && !capsuleStatus.locked && !capsuleUnsealed && (
              <div className="capsule-ready-plaque">
                <span className="capsule-wax-seal capsule-wax-ready" aria-hidden="true"><LockOpen size={16} /></span>
                <div>
                  <strong>Waktunya bangkit · Segel siap dibuka</strong>
                  <small>Tanggal kebangkitan ({capsuleStatus.unlockLabel}) telah tiba.</small>
                </div>
                <Button size="sm" onClick={() => setCapsuleUnsealed(true)}>Buka Segel</Button>
              </div>
            )}

            {capsule && capsuleStatus && !capsuleStatus.locked && capsuleUnsealed && (
              <blockquote className="capsule-revealed">
                <span>Pesan Kebangkitan ({capsuleStatus.unlockLabel})</span>
                <p>“{capsule.message}”</p>
              </blockquote>
            )}

            {!capsule && capsuleOpenForm && (
              <form className="capsule-form" onSubmit={(event) => void handleSealCapsule(event)}>
                <Textarea
                  label="Pesan untuk dirimu di masa depan"
                  rows={3}
                  maxLength={500}
                  value={capsuleDraft}
                  onChange={(event) => setCapsuleDraft(event.target.value)}
                  helperText={`${capsuleDraft.length}/500 · Terkunci hingga tanggal buka segel`}
                />
                <div className="capsule-presets" role="group" aria-label="Pilih durasi segel">
                  {[1, 3, 6, 12].map((months) => {
                    const preset = addMonthsIso(months);
                    return (
                      <button
                        key={months}
                        type="button"
                        className={`capsule-preset ${capsuleDate === preset ? "capsule-preset-active" : ""}`}
                        onClick={() => setCapsuleDate(preset)}
                      >
                        {months === 12 ? "1 Tahun" : `${months} Bulan`}
                      </button>
                    );
                  })}
                </div>
                <Input
                  label="Tanggal buka segel"
                  type="date"
                  value={capsuleDate}
                  onChange={(event) => setCapsuleDate(event.target.value)}
                />
                <div className="capsule-form-actions">
                  <Button type="button" size="sm" variant="ghost" onClick={() => setCapsuleOpenForm(false)}>Batal</Button>
                  <Button type="submit" size="sm" loading={capsuleSaving}><Lock size={14} aria-hidden="true" />Segel Kapsul Waktu</Button>
                </div>
              </form>
            )}
          </section>
        )}

        {!vip && (
          <section className="upgrade-panel" aria-labelledby="upgrade-title">
            <span className="upgrade-emblem" aria-hidden="true"><Crown size={22} strokeWidth={1.5} /></span>
            <div className="upgrade-copy">
              <h3 id="upgrade-title">Abadikan di Bukit Kehormatan</h3>
              <p>Buka 4 material VIP bebas ganti, cetak Akta Gugur Resmi ({serial}), segel Kapsul Waktu, dan nikmati suasana lilin abadi bebas erosi.</p>
            </div>
            <Button variant="secondary" onClick={() => onUpgrade(makam)}><Crown size={15} aria-hidden="true" />Upgrade ke Makam Abadi — Rp 15.000</Button>
          </section>
        )}

        <section className="grave-comments" aria-labelledby="comments-title">
          <div className="grave-comments-heading">
            <h3 id="comments-title"><MessageCircle size={17} aria-hidden="true" />Pesan Belasungkawa</h3>
            <span>{makam.komentar.length}</span>
          </div>
          {makam.komentar.length ? (
            <div className="grave-comment-list">
              {makam.komentar.map((comment) => (
                <article className="grave-comment" key={comment.id}>
                  <Avatar name={comment.nama} size="sm" />
                  <div>
                    <div className="grave-comment-meta"><strong>{comment.nama}</strong><time dateTime={comment.createdAt}>{relativeTime(comment.createdAt)}</time></div>
                    <p>{comment.isi}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Belum ada doa" description="Jadilah yang pertama meninggalkan jejak." icon={<MessageCircle size={18} aria-hidden="true" />} />
          )}
        </section>

        <form className="grave-comment-form" onSubmit={submit}>
          <Textarea label="Tinggalkan doa atau curhat" value={input.isi} maxLength={280} onChange={(event) => setInput((current) => ({ ...current, isi: event.target.value }))} helperText={`${input.isi.length}/280`} />
          <InputName value={input.nama ?? ""} onChange={(value) => setInput((current) => ({ ...current, nama: value }))} />
          <Button type="submit" loading={saving}><MessageCircle size={16} aria-hidden="true" />Kirim belasungkawa</Button>
        </form>
      </div>
    </Dialog>
  );
}

function InputName({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <Input label="Nama" helperText="Opsional — kosongkan untuk Anonim" maxLength={30} value={value} onChange={(event) => onChange(event.target.value)} />;
}

function relativeTime(value: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days} hari lalu` : formatTanggal(value);
}
