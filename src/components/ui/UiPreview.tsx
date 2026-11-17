"use client";

import { Check, LogOut, Search, Sparkles, X } from "lucide-react";
import { DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator } from "./DropdownMenu";
import { useState } from "react";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Chip } from "./Chip";
import { Dialog } from "./Dialog";
import { EmptyState } from "./EmptyState";
import { IconButton } from "./IconButton";
import { Input } from "./Input";
import { Select } from "./Select";
import { Skeleton } from "./Skeleton";
import { Switch } from "./Switch";
import { Textarea } from "./Textarea";
import { ToastProvider, useToast } from "./Toast";
import { Tooltip } from "./Tooltip";

export function UiPreview() {
  return <ToastProvider><PreviewContent /></ToastProvider>;
}

function PreviewContent() {
  const [dialog, setDialog] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const { toast } = useToast();
  return <main className="container-shell min-h-screen py-10"><div className="panel rounded-2xl p-6 sm:p-10"><p className="eyebrow">Development only</p><h1 className="mt-2 text-3xl font-semibold">UI primitives</h1><p className="mt-2 text-sm text-muted">Preview semua primitive CP1.</p>
    <section className="mt-10 space-y-4"><h2 className="text-h2">Buttons</h2><div className="flex flex-wrap items-center gap-3">{(["primary", "secondary", "ghost", "danger"] as const).map((variant) => <Button key={variant} variant={variant}>{variant}</Button>)}<Button size="sm">Small</Button><Button size="lg">Large</Button><Button loading>Loading</Button></div></section>
    <section className="mt-10 space-y-4"><h2 className="text-h2">Controls</h2><div className="grid gap-4 md:grid-cols-2"><Input label="Nama" placeholder="Wacana" leading={<Search size={16} />} trailing={<X size={16} />} helperText="Helper text." /><Input label="Error" defaultValue="Tidak valid" error="Nama belum benar." /><Textarea label="Kronologi" placeholder="Tulis sesuatu" maxLength={120} showCounter helperText="Maksimal 120 karakter." /><Select label="Kategori" defaultValue="lainnya"><option value="lainnya">Lainnya</option><option value="hubungan">Hubungan</option></Select></div><Switch checked={enabled} onChange={(event) => setEnabled(event.target.checked)} label="Catat kerugian" description="Toggle dengan state aktif/nonaktif." /></section>
    <section className="mt-10 space-y-4"><h2 className="text-h2">Chips, badges, avatar</h2><div className="flex flex-wrap items-center gap-3"><Chip active>Aktif</Chip><Chip>Semua</Chip><Badge>Neutral</Badge><Badge tone="accent">Accent</Badge><Badge tone="gold">Gold</Badge><Badge tone="success">Success</Badge><Badge tone="danger">Danger</Badge><Avatar name="Wacana" size="sm" /><Avatar name="Anonim" size="md" /><Avatar name="Ritual" size="lg" /></div></section>
    <section className="mt-10 space-y-4"><h2 className="text-h2">Dropdown</h2><DropdownMenu label="Preview menu" trigger={<span>Menu</span>}><DropdownLabel>Akun peziarah</DropdownLabel><DropdownItem icon={<Sparkles size={16} />} onSelect={() => toast("Item dipilih.")}>Edit profil</DropdownItem><DropdownSeparator /><DropdownItem icon={<LogOut size={16} />} danger onSelect={() => toast("Keluar dipilih.", "danger")}>Keluar</DropdownItem></DropdownMenu></section>
    <section className="mt-10 space-y-4"><h2 className="text-h2">States</h2><div className="flex flex-wrap items-center gap-3"><IconButton label="Dekorasi"><Sparkles size={16} /></IconButton><Tooltip label="Nilai penuh"><Button variant="secondary">Tooltip</Button></Tooltip><Button onClick={() => toast("Profil berhasil disimpan.", "success")}>Toast sukses</Button><Button variant="danger" onClick={() => toast("Aksi gagal.", "danger")}>Toast error</Button></div><div className="grid gap-3 sm:grid-cols-3"><Skeleton className="h-4" /><Skeleton className="h-4" /><Skeleton className="h-4" /></div><EmptyState title="Belum ada makam" description="Ruang ini masih sunyi." actionLabel="Kuburkan wacana" onAction={() => toast("Mulai ritual.")} /></section>
    <section className="mt-10"><Button onClick={() => setDialog(true)}>Buka dialog</Button></section>
  </div><Dialog open={dialog} title="Preview dialog" onClose={() => setDialog(false)}><p className="mt-6 text-sm text-muted">Dialog desktop berubah menjadi bottom sheet di mobile. Escape, klik luar, focus trap, dan scroll lock aktif.</p><div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => setDialog(false)}>Batal</Button><Button onClick={() => { setDialog(false); toast("Dialog disimpan.", "success"); }}><Check size={16} /> Simpan</Button></div></Dialog></main>;
}
