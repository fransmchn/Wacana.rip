"use client";

import { useMemo, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import type { CreateMakamInput, Kategori, Makam } from "@/types/graveyard";
import { getDurasiHari, getLabelDurasi } from "@/lib/utils";

const causes = ["Kehilangan arah", "Waktu dan energi habis", "Prioritas berubah", "Tidak lagi terasa cocok", "Keadaan tidak mendukung", "Berakhir dengan sendirinya"];
const categoryLabels: Record<Kategori, string> = { skripsi: "Skripsi & riset", koding: "Koding & teknologi", desain: "Desain & karya", bisnis: "Bisnis & usaha", resolusi: "Resolusi & hobi", hubungan: "Hubungan", pribadi: "Hal pribadi", pekerjaan: "Pekerjaan & karier", keluarga: "Keluarga", kesehatan: "Kesehatan", perjalanan: "Perjalanan", lainnya: "Lainnya" };
const today = () => new Date().toISOString().slice(0, 10);

interface BuryModalProps { onClose: () => void; onSubmit: (input: CreateMakamInput) => Promise<Makam>; onCreated: (makam: Makam) => void; }

export function BuryModal({ onClose, onSubmit, onCreated }: BuryModalProps) {
  const [form, setForm] = useState<CreateMakamInput>({ judul: "", kategori: "lainnya", pembuat: "", tanggalMulai: today(), tanggalMenyerah: today(), penyebab: causes[0], epitaph: "", kronologi: "" });
  const [showLoss, setShowLoss] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const durasi = useMemo(() => getDurasiHari(form.tanggalMulai, form.tanggalMenyerah), [form.tanggalMulai, form.tanggalMenyerah]);
  const set = <K extends keyof CreateMakamInput>(key: K, value: CreateMakamInput[K]) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setSaving(true);
    try { const makam = await onSubmit(form); onCreated(makam); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Ritual gagal dilakukan."); }
    finally { setSaving(false); }
  }

  return <div role="dialog" aria-modal="true" aria-labelledby="bury-title" className="fixed inset-0 z-30 overflow-y-auto bg-black/75 p-4 sm:p-8" onClick={onClose}>
    <div className="panel mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col rounded-2xl p-5 sm:min-h-0 sm:p-8" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Ritual pemakaman</p><h2 id="bury-title" className="mt-2 text-3xl font-semibold tracking-[-.04em]">Kuburkan Wacana</h2><p className="mt-2 text-sm text-[#a7a69f]">Beri tempat layak bagi sesuatu yang pernah kamu perjuangkan.</p></div><button type="button" onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-full border border-[#ffffff1a] text-[#a7a69f] hover:text-[#f4f1e9]" aria-label="Tutup form"><X size={18} /></button></div>
      <form onSubmit={submit} className="mt-8 flex min-h-0 flex-1 flex-col space-y-5">
        <Field label="Nama wacana / judul" required><input required maxLength={120} value={form.judul} onChange={(event) => set("judul", event.target.value)} placeholder="Contoh: Aplikasi yang mengubah hidup" /></Field>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Kategori" required><select value={form.kategori} onChange={(event) => set("kategori", event.target.value as Kategori)}>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Nama pembuat"><input maxLength={30} value={form.pembuat} onChange={(event) => set("pembuat", event.target.value)} placeholder="Anonim" /></Field></div>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Tanggal mulai" required><input type="date" required max={form.tanggalMenyerah || today()} value={form.tanggalMulai} onChange={(event) => set("tanggalMulai", event.target.value)} /></Field><Field label="Tanggal menyerah" required><input type="date" required max={today()} min={form.tanggalMulai} value={form.tanggalMenyerah} onChange={(event) => set("tanggalMenyerah", event.target.value)} /></Field></div>
        <div className="flex items-center gap-2 rounded-xl border border-[#d8ad69]/25 bg-[#d8ad69]/10 px-4 py-3 text-sm text-[#d8ad69]"><CalendarDays size={16} aria-hidden="true" /> Umur wacana: <strong>{getLabelDurasi(durasi)}</strong></div>
        <Field label="Kenapa berakhir" required><select value={causes.includes(form.penyebab) ? form.penyebab : "lainnya"} onChange={(event) => set("penyebab", event.target.value === "lainnya" ? "" : event.target.value)}>{causes.map((cause) => <option key={cause}>{cause}</option>)}<option value="lainnya">Alasan lain</option></select><input required maxLength={160} className="mt-2" value={form.penyebab} onChange={(event) => set("penyebab", event.target.value)} placeholder="Tulis alasan yang ingin dikenang" /></Field>
        <Field label="Kata terakhir" required counter={`${form.epitaph.length}/140`}><input required maxLength={140} value={form.epitaph} onChange={(event) => set("epitaph", event.target.value)} placeholder="Satu kalimat untuk dikenang" /></Field>
        <Field label="Kronologi singkat" counter={`${(form.kronologi ?? "").length}/1000`}><textarea maxLength={1000} rows={4} value={form.kronologi} onChange={(event) => set("kronologi", event.target.value)} placeholder="Apa yang terjadi?" /></Field>
        <div className="rounded-xl border border-[#ffffff12] bg-[#ffffff04] p-4"><label className="flex cursor-pointer items-start gap-3 text-sm"><input type="checkbox" checked={showLoss} onChange={(event) => { setShowLoss(event.target.checked); if (!event.target.checked) { set("kerugianTeks", undefined); set("kerugianRupiah", undefined); set("kerugianJam", undefined); } }} className="mt-1 h-4 min-h-0 w-4 accent-[#d87078]" /><span><strong className="font-medium text-[#f4f1e9]">Catat kerugian</strong><span className="mt-1 block text-xs leading-5 text-[#a7a69f]">Opsional. Matikan kalau tidak ingin menghitung biaya atau waktu.</span></span></label>{showLoss && <div className="mt-4 grid gap-5 sm:grid-cols-3"><Field label="Catatan"><input value={form.kerugianTeks ?? ""} onChange={(event) => set("kerugianTeks", event.target.value)} placeholder="Kopi, waktu, harapan" /></Field><Field label="Rupiah"><input type="number" min="0" value={form.kerugianRupiah ?? ""} onChange={(event) => set("kerugianRupiah", event.target.value ? Number(event.target.value) : undefined)} placeholder="150000" /></Field><Field label="Jam"><input type="number" min="0" value={form.kerugianJam ?? ""} onChange={(event) => set("kerugianJam", event.target.value ? Number(event.target.value) : undefined)} placeholder="24" /></Field></div>}</div>
        {error && <p role="alert" className="rounded-xl border border-[#d87078]/40 bg-[#d87078]/10 px-4 py-3 text-sm text-[#f08c91]">{error}</p>}
        <button type="submit" disabled={saving} className="sticky bottom-0 min-h-12 w-full rounded-xl bg-[#d87078] px-5 text-sm font-semibold text-[#211116] shadow-[0_-12px_20px_rgba(9,9,11,.7)] transition hover:bg-[#f08c91] disabled:cursor-wait disabled:opacity-60">{saving ? "Menurunkan nisan..." : "Kuburkan wacana"}</button>
      </form>
    </div>
  </div>;
}

function Field({ label, required, counter, children }: { label: string; required?: boolean; counter?: string; children: React.ReactNode }) { return <label className="block text-sm"><span className="mb-2 flex justify-between gap-3 font-medium text-[#f4f1e9]">{label}{required && <span className="text-[#d87078]">wajib</span>}{counter && <span className="font-mono text-[10px] text-[#6c6b67]">{counter}</span>}</span>{children}</label>; }
