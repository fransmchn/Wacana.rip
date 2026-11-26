"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarDays, Check, Crown, RotateCcw } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ThemePicker } from "@/components/ThemePicker";
import { DEFAULT_KATEGORI_DB, KATEGORI, type CreateMakamInput, type Kategori, type Makam, type NisanTema } from "@/types/graveyard";
import { getDurasiHari, getLabelDurasi } from "@/lib/utils";
import { DEFAULT_TEMA, getTemaNisan, isNisanTema } from "@/lib/themes";

export const BURY_DRAFT_STORAGE_KEY = "graveyard_bury_draft_v1";

// Daftar UI tetap lengkap; graveyardService menormalkan nilai ke constraint DB.
const categoryLabels: Record<Kategori, string> = {
  skripsi: "Skripsi & riset", koding: "Koding & teknologi", desain: "Desain & karya",
  bisnis: "Bisnis & usaha", resolusi: "Resolusi & hobi", hubungan: "Hubungan",
  pribadi: "Hal pribadi", pekerjaan: "Pekerjaan & karier", keluarga: "Keluarga",
  kesehatan: "Kesehatan", perjalanan: "Perjalanan", lainnya: "Lainnya",
};
const today = () => new Date().toISOString().slice(0, 10);

interface StoredDraft {
  form: CreateMakamInput;
  showLoss: boolean;
}

const initialForm = (defaultAuthor = ""): CreateMakamInput => ({
  judul: "",
  kategori: DEFAULT_KATEGORI_DB,
  pembuat: defaultAuthor,
  tanggalMulai: today(),
  tanggalMenyerah: today(),
  penyebab: "",
  epitaph: "",
  tema: DEFAULT_TEMA,
});

function hasDraftContent(form: CreateMakamInput, defaultAuthor = ""): boolean {
  return Boolean(
    form.judul.trim() ||
    form.penyebab.trim() ||
    form.epitaph.trim() ||
    form.kerugianTeks?.trim() ||
    form.kerugianRupiah !== undefined ||
    form.kerugianJam !== undefined ||
    form.tema !== DEFAULT_TEMA ||
    form.kategori !== DEFAULT_KATEGORI_DB ||
    (form.pembuat && form.pembuat.trim() && form.pembuat.trim() !== defaultAuthor.trim()),
  );
}

function readDraft(defaultAuthor = ""): { form: CreateMakamInput; showLoss: boolean; restored: boolean } {
  const fresh = initialForm(defaultAuthor);
  if (typeof window === "undefined") return { form: fresh, showLoss: true, restored: false };
  try {
    const raw = window.localStorage.getItem(BURY_DRAFT_STORAGE_KEY);
    if (!raw) return { form: fresh, showLoss: true, restored: false };
    const parsed = JSON.parse(raw) as Partial<StoredDraft>;
    if (!parsed || typeof parsed !== "object" || !parsed.form || typeof parsed.form !== "object") {
      return { form: fresh, showLoss: true, restored: false };
    }
    const f = parsed.form as Partial<CreateMakamInput>;
    const restoredForm: CreateMakamInput = {
      judul: typeof f.judul === "string" ? f.judul.slice(0, 120) : "",
      kategori: typeof f.kategori === "string" && (KATEGORI as readonly string[]).includes(f.kategori) ? (f.kategori as Kategori) : DEFAULT_KATEGORI_DB,
      pembuat: typeof f.pembuat === "string" && f.pembuat.trim() ? f.pembuat.slice(0, 30) : defaultAuthor,
      tanggalMulai: typeof f.tanggalMulai === "string" && /^\d{4}-\d{2}-\d{2}$/.test(f.tanggalMulai) ? f.tanggalMulai : today(),
      tanggalMenyerah: typeof f.tanggalMenyerah === "string" && /^\d{4}-\d{2}-\d{2}$/.test(f.tanggalMenyerah) ? f.tanggalMenyerah : today(),
      penyebab: typeof f.penyebab === "string" ? f.penyebab.slice(0, 160) : "",
      epitaph: typeof f.epitaph === "string" ? f.epitaph.slice(0, 140) : "",
      tema: isNisanTema(f.tema) ? f.tema : DEFAULT_TEMA,
      ...(typeof f.kerugianTeks === "string" && f.kerugianTeks ? { kerugianTeks: f.kerugianTeks.slice(0, 280) } : {}),
      ...(typeof f.kerugianRupiah === "number" && Number.isFinite(f.kerugianRupiah) ? { kerugianRupiah: f.kerugianRupiah } : {}),
      ...(typeof f.kerugianJam === "number" && Number.isFinite(f.kerugianJam) ? { kerugianJam: f.kerugianJam } : {}),
    };
    return {
      form: restoredForm,
      showLoss: typeof parsed.showLoss === "boolean" ? parsed.showLoss : true,
      restored: hasDraftContent(restoredForm, defaultAuthor),
    };
  } catch {
    return { form: fresh, showLoss: true, restored: false };
  }
}

function saveDraft(form: CreateMakamInput, showLoss: boolean, defaultAuthor = ""): void {
  if (typeof window === "undefined") return;
  try {
    if (!hasDraftContent(form, defaultAuthor)) {
      window.localStorage.removeItem(BURY_DRAFT_STORAGE_KEY);
      return;
    }
    const payload: StoredDraft = { form, showLoss };
    window.localStorage.setItem(BURY_DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* Storage penuh atau diblokir — tetap aman tanpa mengganggu form. */
  }
}

function clearStoredDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(BURY_DRAFT_STORAGE_KEY);
  } catch {
    /* Abaikan error storage. */
  }
}

type FieldErrors = Partial<Record<keyof CreateMakamInput, string>>;

interface BuryModalProps {
  onClose: () => void;
  onSubmit: (input: CreateMakamInput) => Promise<Makam>;
  onCreated: (makam: Makam) => void;
  onVipTheme: (input: CreateMakamInput) => Promise<void> | void;
  defaultAuthor?: string;
}

export function BuryModal({ onClose, onSubmit, onCreated, onVipTheme, defaultAuthor = "" }: BuryModalProps) {
  const { toast } = useToast();
  const [initialState] = useState(() => readDraft(defaultAuthor));
  const [form, setForm] = useState<CreateMakamInput>(initialState.form);
  const [showLoss, setShowLoss] = useState(initialState.showLoss);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const durasi = useMemo(() => getDurasiHari(form.tanggalMulai, form.tanggalMenyerah), [form.tanggalMulai, form.tanggalMenyerah]);
  const selectedTheme = getTemaNisan(form.tema);
  // Setiap makam baru dengan tema VIP WAJIB melalui pembayaran — tidak ada bypass global.
  const needsVip = selectedTheme.vip;
  const draftActive = useMemo(() => hasDraftContent(form, defaultAuthor), [form, defaultAuthor]);

  // Auto-save draf setiap kali pengguna mengetik atau memilih tema/opsi.
  useEffect(() => {
    saveDraft(form, showLoss, defaultAuthor);
  }, [form, showLoss, defaultAuthor]);

  const set = <K extends keyof CreateMakamInput>(key: K, value: CreateMakamInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  /** Menutup modal (X, Batal, backdrop, Escape) tetap menjaga draf tersimpan di localStorage. */
  function closePreservingDraft() {
    setErrors({});
    setSaving(false);
    onClose();
  }

  /** Menghapus draf secara eksplisit jika pengguna ingin mulai dari awal. */
  function handleClearDraft() {
    clearStoredDraft();
    setForm(initialForm(defaultAuthor));
    setShowLoss(true);
    setErrors({});
    toast("Draf dihapus. Formulir dikembalikan kosong.", "info");
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!form.judul.trim()) next.judul = "Nama mimpi wajib diisi.";
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
    if (message.includes("Nama mimpi") || message.includes("Nama wacana")) return { judul: message };
    if (message.includes("Tanggal mulai")) return { tanggalMulai: message };
    if (message.includes("Tanggal")) return { tanggalMenyerah: message };
    if (message.includes("Penyebab")) return { penyebab: message };
    if (message.includes("Kata terakhir")) return { epitaph: message };
    if (message.includes("negatif")) return { kerugianRupiah: message };
    return {};
  }

  async function triggerVipFlow() {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
    setErrors({});
    setSaving(true);
    try {
      await onVipTheme(form);
      // Hapus draf hanya setelah makam benar-benar berhasil disimpan & diteruskan ke checkout.
      clearStoredDraft();
    } catch (reason) {
      const next = mapSubmitError(reason);
      setErrors(next);
      toast(reason instanceof Error ? reason.message : "Pemakaman belum bisa dilakukan.", "danger");
    } finally {
      setSaving(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (needsVip) {
      await triggerVipFlow();
      return;
    }
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
    setErrors({});
    setSaving(true);
    try {
      const makam = await onSubmit({ ...form, vip: false });
      clearStoredDraft();
      setForm(initialForm(defaultAuthor));
      toast("Makam berhasil dikuburkan.", "success");
      onCreated(makam);
      onClose();
    } catch (reason) {
      const next = mapSubmitError(reason);
      setErrors(next);
      toast(reason instanceof Error ? reason.message : "Pemakaman belum bisa dilakukan.", "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      title="Kuburkan Mimpi"
      onClose={closePreservingDraft}
      className="modal-dialog-wide"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={closePreservingDraft} disabled={saving}>Batal</Button>
          <Button className="modal-action-primary" type="submit" form="bury-form" loading={saving}>
            {needsVip ? (
              <><Crown size={16} aria-hidden="true" />Kuburkan dengan Tema VIP — Rp 15.000</>
            ) : saving ? (
              "Menurunkan nisan..."
            ) : (
              "Kuburkan Mimpi"
            )}
          </Button>
        </>
      }
    >
      <form id="bury-form" className="modal-form" onSubmit={(event) => void submit(event)}>
        <div className="bury-draft-bar">
          <p className="modal-intro">Beri tempat layak bagi sesuatu yang pernah kamu perjuangkan.</p>
          {draftActive && (
            <div className="bury-draft-status" role="status">
              <span className="bury-draft-badge"><Check size={12} aria-hidden="true" />Draf tersimpan</span>
              <Button type="button" variant="ghost" size="sm" onClick={handleClearDraft} disabled={saving} className="bury-draft-clear">
                <RotateCcw size={13} aria-hidden="true" />
                Hapus Draf
              </Button>
            </div>
          )}
        </div>

        <Input data-autofocus required label="Nama mimpi / judul" value={form.judul} maxLength={120} onChange={(event) => set("judul", event.target.value)} error={errors.judul} counter={`${form.judul.length}/120`} />

        <div className="modal-form-grid">
          <Select label="Kategori" value={form.kategori} onChange={(event) => set("kategori", event.target.value as Kategori)}>
            {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
          <Input label="Nama pembuat" maxLength={30} value={form.pembuat} onChange={(event) => set("pembuat", event.target.value)} helperText="Kosongkan untuk tampil sebagai Anonim" />
        </div>

        <div className="modal-form-grid">
          <Input label="Tanggal mulai" type="date" required max={form.tanggalMenyerah || today()} value={form.tanggalMulai} onChange={(event) => set("tanggalMulai", event.target.value)} error={errors.tanggalMulai} />
          <Input label="Tanggal menyerah" type="date" required max={today()} min={form.tanggalMulai} value={form.tanggalMenyerah} onChange={(event) => set("tanggalMenyerah", event.target.value)} error={errors.tanggalMenyerah} />
        </div>

        <div className="modal-age-note"><CalendarDays size={16} aria-hidden="true" /><span>Umur mimpi: <strong>{getLabelDurasi(durasi)}</strong></span></div>

        <Textarea label="Kenapa berakhir" required maxLength={160} rows={3} value={form.penyebab} onChange={(event) => set("penyebab", event.target.value)} error={errors.penyebab} helperText={`${form.penyebab.length}/160`} />

        <Input label="Kata terakhir / epitaph" required maxLength={140} value={form.epitaph} onChange={(event) => set("epitaph", event.target.value)} error={errors.epitaph} counter={`${form.epitaph.length}/140`} />

        <section className={`loss-panel ${showLoss ? "loss-panel-active" : ""}`} aria-labelledby="loss-title">
          <div className="loss-panel-heading">
            <div><h3 id="loss-title">Catat kerugian</h3><p>Opsional: biaya, waktu, atau hal lain yang ikut hilang.</p></div>
            <label className="loss-toggle">
              <input type="checkbox" checked={showLoss} onChange={(event) => { setShowLoss(event.target.checked); if (!event.target.checked) { set("kerugianTeks", undefined); set("kerugianRupiah", undefined); set("kerugianJam", undefined); } }} />
              <span aria-hidden="true"><Check size={14} /></span>
              <span className="sr-only">Aktifkan pencatatan kerugian</span>
            </label>
          </div>
          {showLoss && (
            <div className="modal-form-grid modal-form-grid-three">
              <Input label="Catatan kerugian" value={form.kerugianTeks ?? ""} onChange={(event) => set("kerugianTeks", event.target.value)} helperText="Misal: tenaga, modal, harapan" />
              <Input label="Kerugian (Rp)" type="number" min="0" value={form.kerugianRupiah ?? ""} onChange={(event) => set("kerugianRupiah", event.target.value ? Number(event.target.value) : undefined)} error={errors.kerugianRupiah} helperText="Angka dalam Rupiah" />
              <Input label="Waktu (Jam)" type="number" min="0" value={form.kerugianJam ?? ""} onChange={(event) => set("kerugianJam", event.target.value ? Number(event.target.value) : undefined)} error={errors.kerugianJam} helperText="Total jam terpakai" />
            </div>
          )}
        </section>

        <ThemePicker
          value={form.tema}
          onChange={(tema: NisanTema) => set("tema", tema)}
          vipUnlocked={false}
          previewTitle={form.judul}
          upgradeLabel="Kuburkan dengan Tema VIP — Rp 15.000"
          onUpgrade={() => void triggerVipFlow()}
        />
      </form>
    </Dialog>
  );
}
