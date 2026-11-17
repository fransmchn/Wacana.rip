"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ImagePlus, LogOut, Trash2, Upload } from "lucide-react";
/* eslint-disable @next/next/no-img-element */
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tooltip } from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/Toast";
import { checkUsernameAvailable, getMyStats, removeAvatar, uploadAvatar, type ProfileStats } from "@/lib/profileService";
import { getProfileDisplay, resolveAvatar, type ProfileRecord } from "@/lib/profile";
import { isProfileValid, normalizeUsername, validateProfile } from "@/lib/profileValidation";
import type { User } from "@supabase/supabase-js";

const PRESETS = ["hantu", "lilin", "bunga", "tengkorak", "nisan", "kelelawar"];
type ProfilePatch = { display_name: string; username: string | null; bio: string | null; avatar_url: string | null };
interface ProfileModalProps { user: User; profile: ProfileRecord | null; onClose: () => void; onSave: (patch: ProfilePatch) => Promise<void>; onLogout: () => void; profileApi?: { getStats: () => Promise<ProfileStats>; checkUsername: (username: string, uid: string) => Promise<boolean>; } }
interface CropOffset { x: number; y: number; }

export function ProfileModal({ user, profile, onClose, onSave, onLogout, profileApi }: ProfileModalProps) {
  const { toast } = useToast();
  const current = getProfileDisplay(user, profile);
  const [name, setName] = useState(current.name);
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [showAvatarPanel, setShowAvatarPanel] = useState(false);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [cropImage, setCropImage] = useState<HTMLImageElement | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState<CropOffset>({ x: 0, y: 0 });
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{ display_name?: string; username?: string; bio?: string }>({});
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cropDragRef = useRef<{ active: boolean; x: number; y: number; offset: CropOffset }>({ active: false, x: 0, y: 0, offset: { x: 0, y: 0 } });
  const initial = useMemo(() => ({ name: current.name, username: profile?.username ?? "", bio: profile?.bio ?? "", avatarUrl: profile?.avatar_url ?? null }), [current.name, profile?.avatar_url, profile?.bio, profile?.username]);
  const dirty = name !== initial.name || username !== initial.username || bio !== initial.bio || avatarUrl !== initial.avatarUrl;
  const validation = validateProfile({ displayName: name, username, bio });
  const avatar = resolveAvatar(avatarUrl, profile?.updated_at);
  const provider = user.app_metadata.provider ?? user.identities?.[0]?.provider;

  useEffect(() => { void (profileApi ? profileApi.getStats() : getMyStats()).then(setStats).catch(() => setStats(null)).finally(() => setStatsLoading(false)); }, [profileApi]);
  useEffect(() => {
    const value = normalizeUsername(username);
    if (value !== username) { setUsername(value); return; }
    setUsernameAvailable(null);
    if (!value || validation.username) { setCheckingUsername(false); return; }
    setCheckingUsername(true);
    const timer = window.setTimeout(() => { void (profileApi ? profileApi.checkUsername(value, user.id) : checkUsernameAvailable(value, user.id)).then(setUsernameAvailable).catch(() => setUsernameAvailable(null)).finally(() => setCheckingUsername(false)); }, 400);
    return () => window.clearTimeout(timer);
  }, [profileApi, username, user.id, validation.username]);
  useEffect(() => () => { if (cropSource) URL.revokeObjectURL(cropSource); }, [cropSource]);

  function closeRequest() { if (dirty) setConfirmClose(true); else onClose(); }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const errors = validateProfile({ displayName: name, username, bio });
    if (!isProfileValid({ displayName: name, username, bio }) || usernameAvailable === false) { setFieldErrors({ ...errors, ...(usernameAvailable === false ? { username: "Username sudah dipakai." } : {}) }); return; }
    setFieldErrors({}); setSaving(true);
    try { await onSave({ display_name: name.trim(), username: normalizeUsername(username) || null, bio: bio.trim() || null, avatar_url: avatarUrl }); toast("Profil berhasil disimpan.", "success"); onClose(); }
    catch (reason) { const error = reason as { field?: keyof typeof fieldErrors; message?: string }; if (error.field) setFieldErrors({ [error.field]: error.message }); toast(error.message ?? "Profil gagal disimpan.", "danger"); }
    finally { setSaving(false); }
  }

  function selectFile(file: File) {
    if (file.size > 2 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast("Pilih gambar JPG, PNG, atau WebP maksimal 2 MB.", "danger"); return; }
    const source = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { setCropSource(source); setCropImage(image); setCropZoom(1); setCropOffset({ x: 0, y: 0 }); };
    image.onerror = () => { URL.revokeObjectURL(source); toast("File tidak bisa dibaca sebagai gambar.", "danger"); };
    image.src = source;
  }

  function moveCrop(event: React.PointerEvent<HTMLDivElement>) {
    if (!cropDragRef.current.active) return;
    const next = { x: cropDragRef.current.offset.x + event.clientX - cropDragRef.current.x, y: cropDragRef.current.offset.y + event.clientY - cropDragRef.current.y };
    setCropOffset(clampOffset(next, cropImage, cropZoom));
  }

  async function commitCrop() {
    if (!cropImage || !cropSource) return;
    const canvas = document.createElement("canvas"); canvas.width = 256; canvas.height = 256;
    const context = canvas.getContext("2d"); if (!context) return;
    const scale = Math.max(256 / cropImage.naturalWidth, 256 / cropImage.naturalHeight) * cropZoom;
    const offset = { x: cropOffset.x * (256 / 220), y: cropOffset.y * (256 / 220) };
    context.drawImage(cropImage, (256 - cropImage.naturalWidth * scale) / 2 + offset.x, (256 - cropImage.naturalHeight * scale) / 2 + offset.y, cropImage.naturalWidth * scale, cropImage.naturalHeight * scale);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        const next = await uploadAvatar(user.id, blob);
        const previous = avatarUrl;
        try {
          await onSave({ display_name: name.trim(), username: normalizeUsername(username) || null, bio: bio.trim() || null, avatar_url: next });
        } catch (reason) {
          await removeAvatar(user.id, next).catch(() => undefined);
          throw reason;
        }
        setAvatarUrl(next);
        if (previous && previous !== next) await removeAvatar(user.id, previous).catch(() => undefined);
        setCropSource(null); setCropImage(null);
        toast("Foto profil berhasil diunggah.", "success");
      } catch (reason) {
        toast(reason instanceof Error ? reason.message : "Foto profil gagal diunggah.", "danger");
      }
    }, "image/webp", .86);
  }

  return <Dialog open title="Edit profil" onClose={closeRequest} className="profile-dialog" footer={<><Button type="button" variant="secondary" onClick={closeRequest}>Batal</Button><Button type="submit" form="profile-form" loading={saving} disabled={!dirty || Object.keys(validation).length > 0 || usernameAvailable === false}>Simpan perubahan</Button></>}><form id="profile-form" className="profile-form" onSubmit={submit}>
    <div className="profile-avatar-section"><Avatar name={current.name} src={avatar.type === "image" ? avatar.url : avatar.type === "preset" ? `preset:${avatar.key}` : null} tone={current.avatarTone} size="lg" /><Button type="button" variant="secondary" size="sm" aria-expanded={showAvatarPanel} onClick={() => setShowAvatarPanel((value) => !value)}><ImagePlus size={15} />Ganti foto<ChevronDown size={15} aria-hidden="true" /></Button></div>
    {showAvatarPanel && <div className="profile-avatar-panel"><div><h3 className="profile-upload-heading">Unggah foto</h3><div className="profile-upload-actions"><Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}><Upload size={15} />Upload</Button><input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (file) selectFile(file); event.currentTarget.value = ""; }} /><Button type="button" variant="ghost" size="sm" className="ui-button-danger" onClick={() => setAvatarUrl(null)}><Trash2 size={15} />Hapus foto</Button></div></div><div className="profile-upload-separator">atau pilih avatar</div>{cropImage && <div className="profile-crop"><div className="profile-crop-preview" onPointerDown={(event) => { cropDragRef.current = { active: true, x: event.clientX, y: event.clientY, offset: cropOffset }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={moveCrop} onPointerUp={() => { cropDragRef.current.active = false; }} onPointerCancel={() => { cropDragRef.current.active = false; }}><img src={cropSource ?? ""} alt="Pratinjau foto profil" style={{ transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(${cropZoom})` }} /></div><label className="ui-field"><span className="ui-field-label">Perbesar</span><input type="range" min="1" max="3" step=".05" value={cropZoom} onChange={(event) => { const nextZoom = Number(event.target.value); setCropZoom(nextZoom); setCropOffset(clampOffset(cropOffset, cropImage, nextZoom)); }} /></label><Button type="button" size="sm" onClick={() => void commitCrop()}>Pakai foto</Button></div>}<div className="profile-presets">{PRESETS.map((preset) => <Tooltip key={preset} label={preset}><button type="button" className="profile-preset-button" aria-label={preset} aria-pressed={avatarUrl === `preset:${preset}`} onClick={() => setAvatarUrl(`preset:${preset}`)}><Avatar name={preset} src={`preset:${preset}`} size="sm" />{avatarUrl === `preset:${preset}` && <span className="profile-preset-check"><Check size={11} strokeWidth={3} aria-hidden="true" /></span>}</button></Tooltip>)}</div><p className="ui-field-help">JPG, PNG, atau WebP. Maksimal 2 MB.</p></div>}
    <Input data-autofocus required label="Nama tampilan" id="profile-name" value={name} maxLength={32} onChange={(event) => setName(event.target.value)} error={fieldErrors.display_name ?? validation.displayName} counter={`${name.length}/32`} />
    <Input label="Username" id="profile-username" value={username} maxLength={20} onChange={(event) => setUsername(event.target.value)} error={fieldErrors.username ?? validation.username} leading={<span>@</span>} placeholder="contoh: frans_chan" helperText={checkingUsername ? "Memeriksa..." : username && !validation.username ? usernameAvailable === true ? "Username tersedia." : usernameAvailable === false ? "Username sudah dipakai." : undefined : "3-20 karakter: huruf kecil, angka, underscore"} />
    <Textarea label="Epitaf pribadi" id="profile-bio" value={bio} maxLength={120} onChange={(event) => setBio(event.target.value)} error={fieldErrors.bio ?? validation.bio} placeholder="Tulis epitaf untuk dirimu sendiri" helperText={`${bio.length}/120`} />
    <Input label="Email" value={user.email ?? ""} disabled trailing={<Badge tone="neutral">{provider === "google" ? "Google" : "Magic link"}</Badge>} />
    {(statsLoading || stats) && <div className="profile-stats"><h3>Statistik peziarah</h3>{statsLoading ? <div className="profile-stats-grid"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div> : stats && <div className="profile-stats-grid"><Stat label="Wacana dikubur" value={stats.wacanaDikubur} /><Stat label="Bunga ditabur" value={stats.bungaDitabur} /><Stat label="Lilin dinyalakan" value={stats.lilinDinyalakan} /></div>}</div>}
    <div className="profile-danger"><p>Zona berbahaya</p><Button type="button" variant="ghost" onClick={onLogout}><LogOut size={15} />Keluar</Button><Button type="button" variant="danger" disabled><Trash2 size={15} />Hapus akun</Button><small>Segera hadir</small></div>
    {confirmClose && <div className="profile-confirm" role="alertdialog" aria-label="Konfirmasi perubahan"><p>Buang perubahan?</p><Button type="button" variant="secondary" onClick={onClose}>Buang</Button><Button type="button" onClick={() => setConfirmClose(false)}>Lanjut edit</Button></div>}
  </form></Dialog>;
}

function clampOffset(offset: CropOffset, image: HTMLImageElement | null, zoom: number): CropOffset {
  if (!image) return offset;
  const scale = Math.max(220 / image.naturalWidth, 220 / image.naturalHeight) * zoom;
  return { x: Math.max(-Math.max(0, image.naturalWidth * scale - 220) / 2, Math.min(Math.max(0, image.naturalWidth * scale - 220) / 2, offset.x)), y: Math.max(-Math.max(0, image.naturalHeight * scale - 220) / 2, Math.min(Math.max(0, image.naturalHeight * scale - 220) / 2, offset.y)) };
}

function Stat({ label, value }: { label: string; value: number }) { return <div><strong>{value.toLocaleString("id-ID")}</strong><span>{label}</span></div>; }
