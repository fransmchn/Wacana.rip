"use client";

import { useMemo, useState, type FormEvent } from "react";
import { CalendarDays, Check, Crown } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ThemePicker } from "@/components/ThemePicker";
import { DEFAULT_KATEGORI_DB, type CreateMakamInput, type Kategori, type Makam, type NisanTema } from "@/types/graveyard";
import { getDurasiHari, getLabelDurasi } from "@/lib/utils";
import { DEFAULT_TEMA, getTemaNisan } from "@/lib/themes";

// Daftar UI tetap lengkap; graveyardService menormalkan nilai ke constraint DB.
const categoryLabels: Record<Kategori, string> = { skripsi: "Skripsi & riset", koding: "Koding & teknologi", desain: "Desain & karya", bisnis: "Bisnis & usaha", resolusi: "Resolusi & hobi", hubungan: "Hubungan", pribadi: "Hal pribadi", pekerjaan: "Pekerjaan & karier", keluarga: "Keluarga", kesehatan: "Kesehatan", perjalanan: "Perjalanan", lainnya: "Lainnya" };
const today = () => new Date().toISOString().slice(0, 10);
type FieldErrors = Partial<Record<keyof CreateMakamInput, string>>;

interface BuryModalProps {
  onClose: () => void;
  onSubmit: (input: CreateMakamInput) => Promise<Makam>;
  onCreated: (makam: Makam) => void;
  vipUnlocked: boolean;
  onVipTheme: (input: CreateMakamInput) => void;
}

export function BuryModal({ onClose, onSubmit, onCreated, vipUnlocked, onVipTheme }: BuryModalProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<CreateMakamInput>({ judul: "", kategori: DEFAULT_KATEGORI_DB, pembuat: "", tanggalMulai: today(), tanggalMenyerah: today(), penyebab: "", epitaph: "", tema: DEFAULT_TEMA });
  const [showLoss, setShowLoss] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const durasi = useMemo(() => getDurasiHari(form.tanggalMulai, form.tanggalMenyerah), [form.tanggalMulai, form.tanggalMenyerah]);
  const selectedTheme = getTemaNisan(form.tema);
  const needsVip = selectedTheme.vip && !vipUnlocked;
  const dirty = Object.entries(form).some(([key, value]) => key === "kategori" ? value !== DEFAULT_KATEGORI_DB : key === "tema" ? value !== DEFAULT_TEMA : key === "tanggalMulai" || key === "tanggalMenyerah" ? false : Boolean(value));
  const set = <K extends keyof CreateMakamInput>(key: K, value: CreateMakamInput[K]) => setForm((current) => ({ ...current, [key]: value }));

  function requestClose() { if (dirty) setConfirmClose(true); else onClose(); }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!form.judul.trim()) next.judul = "Nama wacana wajib diisi.";
    if (!form.tanggalMulai) next.tanggalMulai = "Tanggal mulai wajib diisi.";
    if (!form.tanggalMenyerah) next.tanggalMenyerah = "Tanggal menyerah wajib diisi.";
    if (form.tanggalMulai && form.tanggalMenyerah && form.tanggalMenyerah < form.tanggalMulai) next.tanggalMenyerah = "Tanggal gugur tidak boleh sebelum tanggal lahir.";
    if (form.tanggalMenyerah > today()) next.tanggalMenyerah = "Tanggal gugur belum terjadi.";
    if (!form.penyebab.trim()) next.penyebab = "Penyebab kematian wajib diisi.";
    if (!form.epitaph.trim()) next.epitaph = "Kata terakhir wajib diisi.";
    for (const [key, label] of [["kerugianRupiah", "Rupiah"], ["kerugianJam", "Jam"]] as const) {
      const value = form[key];
      if (value !== undefined && (!Number.isFinite(value) || value < 0)) next[key] = `${label} tidak boleh negatif.`;
    }
    return next;
  }

  function mapSubmitError(reason: unknown): FieldErrors {
    const message = reason instanceof Error ? reason.message : "Ritual gagal dilakukan.";
    if (message.includes("Nama wacana")) return { judul: message };
    if (message.includes("Tanggal mulai")) return { tanggalMulai: message };
    if (message.includes("Tanggal")) return { tanggalMenyerah: message };
    if (message.includes("Penyebab")) return { penyebab: message };
    if (message.includes("Kata terakhir")) return { epitaph: message };
    if (message.includes("negatif")) return { kerugianRupiah: message };
    return {};
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
    if (needsVip) { onVipTheme(form); return; }
    setErrors({}); setSaving(true);
    try { const makam = await onSubmit(form); toast("Makam berhasil dikuburkan.", "success"); onCreated(makam); }
    catch (reason) { const next = mapSubmitError(reason); setErrors(next); toast(reason instanceof Error ? reason.message : "Pemakaman belum bisa dilakukan.", "danger"); }
    finally { setSaving(false); }
  }

  return <Dialog open title="Kuburkan wacana" onClose={requestClose} className="modal-dialog-wide" footer={<>
    <Button type="button" variant="ghost" onClick={requestClose}>Batal</Button>
    <Button className="modal-action-primary" type="submit" form="bury-form" loading={saving}>
      {needsVip ? <><Crown size={16} aria-hidden="true" />Buka Semua Tema &amp; Abadikan (VIP - Rp 15.000)</> : saving ? "Menurunkan nisan..." : "Kuburkan wacana"}
    </Button>
  </>}>
    <form id="bury-form" className="modal-form" onSubmit={(event) => void submit(event)}>
      <p className="modal-intro">Beri tempat layak bagi sesuatu yang pernah kamu perjuangkan.</p>
      <Input data-autofocus required label="Nama wacana / judul" value={form.judul} maxLength={120} onChange={(event) => set("judul", event.target.value)} placeholder="Contoh: Aplikasi yang mengubah hidup" error={errors.judul} counter={`${form.judul.length}/120`} />
      <div className="modal-form-grid"><Select label="Kategori" value={form.kategori} onChange={(event) => set("kategori", event.target.value as Kategori)}>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Input label="Nama pembuat" maxLength={30} value={form.pembuat} onChange={(event) => set("pembuat", event.target.value)} placeholder="Anonim" /></div>
      <div className="modal-form-grid"><Input label="Tanggal mulai" type="date" required max={form.tanggalMenyerah || today()} value={form.tanggalMulai} onChange={(event) => set("tanggalMulai", event.target.value)} error={errors.tanggalMulai} /><Input label="Tanggal menyerah" type="date" required max={today()} min={form.tanggalMulai} value={form.tanggalMenyerah} onChange={(event) => set("tanggalMenyerah", event.target.value)} error={errors.tanggalMenyerah} /></div>
      <div className="modal-age-note"><CalendarDays size={16} aria-hidden="true" /><span>Umur wacana: <strong>{getLabelDurasi(durasi)}</strong></span></div>
      <Textarea label="Kenapa berakhir" required maxLength={160} rows={3} value={form.penyebab} onChange={(event) => set("penyebab", event.target.value)} placeholder="Contoh: kami memilih jalan masing-masing" error={errors.penyebab} helperText={`${form.penyebab.length}/160`} />
      <Input label="Kata terakhir" required maxLength={140} value={form.epitaph} onChange={(event) => set("epitaph", event.target.value)} placeholder="Satu kalimat untuk dikenang" error={errors.epitaph} counter={`${form.epitaph.length}/140`} />
      <section className={`loss-panel ${showLoss ? "loss-panel-active" : ""}`} aria-labelledby="loss-title"><div className="loss-panel-heading"><div><h3 id="loss-title">Catat kerugian</h3><p>Opsional: biaya, waktu, atau hal lain yang ikut hilang.</p></div><label className="loss-toggle"><input type="checkbox" checked={showLoss} onChange={(event) => { setShowLoss(event.target.checked); if (!event.target.checked) { set("kerugianTeks", undefined); set("kerugianRupiah", undefined); set("kerugianJam", undefined); } }} /><span aria-hidden="true"><Check size={14} /></span><span className="sr-only">Aktifkan pencatatan kerugian</span></label></div>{showLoss && <div className="modal-form-grid modal-form-grid-three"><Input label="Catatan" value={form.kerugianTeks ?? ""} onChange={(event) => set("kerugianTeks", event.target.value)} placeholder="Kopi, waktu, harapan" /><Input label="Rupiah" type="number" min="0" value={form.kerugianRupiah ?? ""} onChange={(event) => set("kerugianRupiah", event.target.value ? Number(event.target.value) : undefined)} placeholder="150000" error={errors.kerugianRupiah} /><Input label="Jam" type="number" min="0" value={form.kerugianJam ?? ""} onChange={(event) => set("kerugianJam", event.target.value ? Number(event.target.value) : undefined)} placeholder="24" error={errors.kerugianJam} /></div>}</section>
      <ThemePicker value={form.tema} onChange={(tema: NisanTema) => set("tema", tema)} vipUnlocked={vipUnlocked} previewTitle={form.judul} onUpgrade={() => { const nextErrors = validate(); if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; } onVipTheme(form); }} />
      {confirmClose && <div className="modal-confirm" role="alertdialog" aria-label="Konfirmasi buang isian"><p>Buang isian?</p><span>Isian yang belum disimpan akan hilang.</span><div><Button type="button" variant="ghost" onClick={() => setConfirmClose(false)}>Lanjut edit</Button><Button type="button" variant="danger" onClick={onClose}>Buang isian</Button></div></div>}
    </form>
  </Dialog>;
}
