"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { ProfileModal } from "@/components/ProfileModal";
import { BuryModal } from "@/components/BuryModal";
import { GraveDetailModal } from "@/components/GraveDetailModal";
import { DeathCertificateModal } from "@/components/DeathCertificateModal";
import { Button } from "@/components/ui/Button";
import { getProfileDisplay, type ProfileRecord } from "@/lib/profile";
import { getErosionInfo } from "@/lib/utils";
import type { CreateMakamInput, Makam } from "@/types/graveyard";
import type { User } from "@supabase/supabase-js";

const user = { id: "fixture-frans", email: "frans@example.com", user_metadata: { full_name: "Frans Muhammed Chan" }, app_metadata: { provider: "google" }, identities: [{ provider: "google" }] } as unknown as User;
const profile: ProfileRecord = { id: user.id, display_name: "Frans Muhammed Chan", username: "frans_chan", bio: "Makam fixture", avatar_url: null };
const makam: Makam = { id: "fixture-long", judul: "Wacana panjang untuk menguji batas layout kartu dan modal", kategori: "koding", pembuat: "Frans Muhammed Chan", tanggalMulai: "2024-01-01", tanggalMenyerah: "2025-01-01", penyebab: "Teks penyebab panjang untuk menguji line clamp dan kontras setiap material.", epitaph: "Yang panjang tidak boleh merusak ruang.", kronologi: "Kronologi fixture panjang.", kerugianTeks: "Waktu", kerugianRupiah: 120000, kerugianJam: 40, bunga: 14, lilin: true, lilinCount: 3, komentar: [{ id: "comment-1", nama: "Frans Muhammed Chan", isi: "Komentar fixture dengan teks cukup panjang untuk menguji scroll.", createdAt: new Date().toISOString() }], createdAt: new Date().toISOString() };

export default function FixturesPage() {
  const [modal, setModal] = useState<"profile" | "bury" | "grave" | "certificate" | null>("profile");
  const display = getProfileDisplay(user, profile);
  return <main id="main" className="container-shell min-h-screen py-10"><Header onBury={() => setModal("bury")} profile={display} onLogin={() => undefined} onEditProfile={() => setModal("profile")} onLogout={() => undefined} profileMenuOpen /><section className="surface-panel ui-preview-surface mt-10"><p className="eyebrow">Development fixture</p><h1 className="mt-2 text-display">Login state fixtures</h1><p className="mt-2 text-sm text-muted">Data palsu. Tidak memanggil Supabase untuk aksi fixture.</p><div className="mt-8 flex flex-wrap gap-3"><Button onClick={() => setModal("profile")}>Edit profil</Button><Button onClick={() => setModal("bury")}>Kuburkan wacana</Button><Button onClick={() => setModal("grave")}>Detail makam</Button><Button onClick={() => setModal("certificate")}>Sertifikat</Button></div></section>{modal === "profile" && <ProfileModal user={user} profile={profile} onClose={() => setModal(null)} onSave={async () => undefined} onLogout={() => undefined} profileApi={{ getStats: async () => ({ wacanaDikubur: 4, bungaDitabur: 12, lilinDinyalakan: 3 }), checkUsername: async () => true }} />}{modal === "bury" && <BuryModal onClose={() => setModal(null)} onSubmit={async (input: CreateMakamInput) => ({ ...makam, ...input, kategori: input.kategori, pembuat: input.pembuat ?? "Anonim", kronologi: input.kronologi ?? "", kerugianTeks: input.kerugianTeks ?? "", bunga: 0, lilin: false, komentar: [], createdAt: new Date().toISOString() })} onCreated={() => setModal(null)} />}{modal === "grave" && <GraveDetailModal makam={makam} onClose={() => setModal(null)} onFlower={() => undefined} onCandle={() => undefined} onComment={async () => undefined} flowerStatus="active" flowerCountdown="besok" candleMine={false} vip={false} erosion={getErosionInfo(makam)} onUpgrade={() => undefined} />}{modal === "certificate" && <DeathCertificateModal makam={makam} onClose={() => setModal(null)} />}</main>;
}
