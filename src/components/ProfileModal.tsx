"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface ProfileModalProps {
  initialName: string;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}

export function ProfileModal({ initialName, onClose, onSave }: ProfileModalProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try { await onSave(name); onClose(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Profil gagal diperbarui."); }
    finally { setSaving(false); }
  }

  return <div role="dialog" aria-modal="true" aria-labelledby="profile-title" className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4" onClick={onClose}>
    <div className="panel modal-surface w-full max-w-md rounded-2xl p-6 sm:p-8" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-4 border-b border-[#ffffff12] pb-6">
        <div><p className="eyebrow">Identitas peziarah</p><h2 id="profile-title" className="mt-2 text-2xl font-semibold">Edit profil</h2><p className="mt-2 text-sm leading-6 text-[#a7a69f]">Nama ini tampil saat kamu meninggalkan doa atau wacana.</p></div>
        <button type="button" onClick={onClose} className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-full border border-[#ffffff1a] text-[#a7a69f] hover:border-[#ffffff35] hover:bg-[#ffffff08] hover:text-[#f4f1e9]" aria-label="Tutup edit profil"><X size={18} /></button>
      </div>
      <form onSubmit={submit} className="mt-6 space-y-5">
        <label className="block text-sm font-medium" htmlFor="profile-name">Nama tampilan<span className="ml-1 text-[#f08c91]" aria-label="wajib diisi">*</span><input id="profile-name" required maxLength={30} value={name} onChange={(event) => setName(event.target.value)} className="mt-2" placeholder="Anonim" /></label>
        {error && <p role="alert" className="rounded-xl border border-[#d87078]/40 bg-[#d87078]/10 px-4 py-3 text-sm text-[#f08c91]">{error}</p>}
        <button type="submit" disabled={saving} className="min-h-12 w-full rounded-xl bg-[#d87078] text-sm font-semibold text-[#211116] hover:bg-[#f08c91] disabled:cursor-wait disabled:opacity-60">{saving ? "Menyimpan..." : "Simpan profil"}</button>
      </form>
    </div>
  </div>;
}
