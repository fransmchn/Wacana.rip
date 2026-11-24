"use client";

import { useState, type FormEvent } from "react";
import { Save } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { EditMakamInput, Kategori, Makam } from "@/types/graveyard";

const categoryLabels: Record<Kategori, string> = {
  skripsi: "Skripsi & riset", koding: "Koding & teknologi", desain: "Desain & karya",
  bisnis: "Bisnis & usaha", resolusi: "Resolusi & hobi", hubungan: "Hubungan",
  pribadi: "Hal pribadi", pekerjaan: "Pekerjaan & karier", keluarga: "Keluarga",
  kesehatan: "Kesehatan", perjalanan: "Perjalanan", lainnya: "Lainnya",
};

interface EditGraveModalProps {
  makam: Makam;
  onClose: () => void;
  onSave: (input: EditMakamInput) => Promise<void>;
}

export function EditGraveModal({ makam, onClose, onSave }: EditGraveModalProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<EditMakamInput>({
    judul: makam.judul,
    kategori: makam.kategori,
    penyebab: makam.penyebab,
    epitaph: makam.epitaph,
  });
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      toast("Nisan berhasil diperbarui.", "success");
      onClose();
    } catch (reason) {
      toast(reason instanceof Error ? reason.message : "Perubahan gagal disimpan.", "danger");
    } finally { setSaving(false); }
  }

  return (
    <Dialog open title="Edit makam" onClose={onClose} className="modal-dialog-wide" footer={<>
      <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
      <Button type="submit" form="edit-grave-form" loading={saving}><Save size={16} aria-hidden="true" />Simpan perubahan</Button>
    </>}>
      <form id="edit-grave-form" className="edit-grave-form" onSubmit={(event) => void submit(event)}>
        <p className="modal-intro">Ubah catatan di nisan. Tanggal dan kerugian tidak diubah agar riwayat tetap jujur.</p>
        <Input label="Nama wacana" value={form.judul} maxLength={120} required onChange={(event) => setForm({ ...form, judul: event.target.value })} />
        <Select label="Kategori" value={form.kategori} onChange={(event) => setForm({ ...form, kategori: event.target.value as Kategori })}>
          {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
        <Input label="Penyebab gugur" value={form.penyebab} maxLength={160} required onChange={(event) => setForm({ ...form, penyebab: event.target.value })} />
        <Textarea label="Kata terakhir / epitaph" value={form.epitaph} maxLength={140} required showCounter onChange={(event) => setForm({ ...form, epitaph: event.target.value })} />
      </form>
    </Dialog>
  );
}
