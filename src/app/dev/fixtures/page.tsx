"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { ProfileModal } from "@/components/ProfileModal";
import { BuryModal } from "@/components/BuryModal";
import { GraveDetailModal } from "@/components/GraveDetailModal";
import { CheckoutModal } from "@/components/CheckoutModal";
import { StoryStudioModal } from "@/components/StoryStudioModal";
import { Button } from "@/components/ui/Button";
import { VIP_PRICE, type CreateCheckoutParams } from "@/lib/payment";
import { getProfileDisplay, type ProfileRecord } from "@/lib/profile";
import { getErosionInfo } from "@/lib/utils";
import type { CreateMakamInput, Makam, NisanTema } from "@/types/graveyard";
import type { User } from "@supabase/supabase-js";

const user = { id: "fixture-frans", email: "frans@example.com", user_metadata: { full_name: "Frans Muhammed Chan" }, app_metadata: { provider: "google" }, identities: [{ provider: "google" }] } as unknown as User;
const profile: ProfileRecord = { id: user.id, display_name: "Frans Muhammed Chan", username: "frans_chan", bio: "Makam fixture", avatar_url: null };
const makam: Makam = {
  id: "fixture-long", judul: "Wacana panjang untuk menguji batas layout kartu dan modal",
  kategori: "koding", pembuat: "Frans Muhammed Chan", tanggalMulai: "2024-01-01",
  tanggalMenyerah: "2025-01-01", penyebab: "Teks penyebab panjang untuk menguji line clamp dan kontras setiap material.",
  epitaph: "Yang panjang tidak boleh merusak ruang.", kronologi: "Kronologi fixture panjang.",
  kerugianTeks: "Waktu", kerugianRupiah: 120000, kerugianJam: 40, bunga: 14, tema: "crimson-velvet",
  komentar: [{ id: "comment-1", nama: "Frans Muhammed Chan", isi: "Komentar fixture dengan teks cukup panjang untuk menguji scroll.", createdAt: new Date().toISOString() }],
  createdAt: new Date().toISOString(),
};

const checkoutPreview: CreateCheckoutParams = {
  graveId: "fixture-long", graveTitle: makam.judul, selectedTheme: "obsidian-emas", amount: VIP_PRICE, userId: user.id,
};

type FixtureModal = "profile" | "bury" | "grave" | "story" | "checkout" | null;

export default function FixturesPage() {
  const [modal, setModal] = useState<FixtureModal>("profile");
  const [params, setParams] = useState<CreateCheckoutParams>(checkoutPreview);
  const display = getProfileDisplay(user, profile);

  function openCheckout(theme: NisanTema = "obsidian-emas") {
    setParams({ ...checkoutPreview, selectedTheme: theme });
    setModal("checkout");
  }

  return (
    <main id="main" className="container-shell min-h-screen py-10">
      <Header onBury={() => setModal("bury")} profile={display} onLogin={() => undefined} onEditProfile={() => setModal("profile")} onLogout={() => undefined} profileMenuOpen />
      <section className="surface-panel ui-preview-surface mt-10">
        <p className="eyebrow">Development fixture</p>
        <h1 className="mt-2 text-display">Login state fixtures</h1>
        <p className="mt-2 text-sm text-muted">Data palsu. Tidak memanggil Supabase untuk aksi fixture.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={() => setModal("profile")}>Edit profil</Button>
          <Button onClick={() => setModal("bury")}>Kuburkan Mimpi</Button>
          <Button onClick={() => setModal("grave")}>Inspeksi Monumen</Button>
          <Button onClick={() => setModal("story")}>Story Studio</Button>
          <Button onClick={() => openCheckout()}>Checkout VIP</Button>
        </div>
        <div className="fixture-theme-strip" aria-label="Pratinjau tema nisan">
          {["batu-lapuk", "beton-retak", "obsidian-emas", "marmer-lumut", "y2k-chrome", "crimson-velvet"].map((theme) => <span key={theme} className={`fixture-theme-chip theme-swatch-${theme}`}>{theme.replaceAll("-", " ")}</span>)}
        </div>
      </section>

      {modal === "profile" && <ProfileModal user={user} profile={profile} onClose={() => setModal(null)} onSave={async () => undefined} onLogout={() => undefined} profileApi={{ getStats: async () => ({ wacanaDikubur: 4, bungaDitabur: 12 }), checkUsername: async () => true }} />}
      {modal === "bury" && <BuryModal key="bury-fixture" onClose={() => setModal(null)} onSubmit={async (input: CreateMakamInput) => ({ ...makam, ...input, pembuat: input.pembuat ?? "Anonim", kronologi: input.kronologi ?? "", kerugianTeks: input.kerugianTeks ?? "", bunga: 0, komentar: [], createdAt: new Date().toISOString() })} onCreated={() => setModal(null)} onVipTheme={(input) => openCheckout(input.tema)} />}
      {modal === "grave" && <GraveDetailModal makam={makam} onClose={() => setModal(null)} onFlower={() => undefined} onComment={async () => undefined} flowerStatus="active" flowerCountdown="besok" vip={false} erosion={getErosionInfo(makam)} onUpgrade={() => openCheckout()} onOpenStory={() => setModal("story")} />}
      {modal === "story" && <StoryStudioModal makam={makam} vip={false} theme="crimson-velvet" onClose={() => setModal(null)} onUpgrade={() => openCheckout()} />}
      {modal === "checkout" && <CheckoutModal params={params} onClose={() => setModal(null)} onConfirm={async () => undefined} />}
    </main>
  );
}
