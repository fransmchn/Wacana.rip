"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LoginModal } from "@/components/LoginModal";
import { ProfileModal } from "@/components/ProfileModal";
import { AmbientBackground } from "@/components/AmbientBackground";
import { BuryModal } from "@/components/BuryModal";
import { DeathCertificateModal } from "@/components/DeathCertificateModal";
import { GraveDetailModal } from "@/components/GraveDetailModal";
import { FilterBar, type SortKey } from "@/components/FilterBar";
import { Header } from "@/components/Header";
import { StatsBanner } from "@/components/StatsBanner";
import { TombstoneGrid } from "@/components/TombstoneGrid";
import { useGraveyard } from "@/hooks/useGraveyard";
import type { Kategori, Makam } from "@/types/graveyard";
import { getDurasiHari } from "@/lib/utils";
import { useWibCountdown } from "@/components/useWibCountdown";
import { Button } from "@/components/ui/Button";
import { HeroIllustration } from "@/components/HeroIllustration";
import { getProfileDisplay } from "@/lib/profile";

export default function Home() {
  const { makam, statistik, loading, error, bunga, lilin, komentar, kuburkan, bungaStatus, lilinSaya, refreshPersonalStatus } = useGraveyard();
  const { user, configured, updateProfile, signOut } = useAuth();
  const profile = getProfileDisplay(user);
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [category, setCategory] = useState<"semua" | Kategori>("semua");
  const [sort, setSort] = useState<SortKey>("terbaru");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Makam | null>(null);
  const [buryOpen, setBuryOpen] = useState(false);
  const [certificate, setCertificate] = useState<Makam | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const heroCtaRef = useRef<HTMLButtonElement>(null);
  const [heroCtaVisible, setHeroCtaVisible] = useState(true);
  useEffect(() => { if (!heroCtaRef.current || !("IntersectionObserver" in window)) return; const observer = new IntersectionObserver(([entry]) => setHeroCtaVisible(entry.isIntersecting), { threshold: .1 }); observer.observe(heroCtaRef.current); return () => observer.disconnect(); }, []);
  const requireLogin = (action: () => void) => { if (!user) { setLoginOpen(true); return; } action(); };
  const filtered = useMemo(() => makam
    .filter((item) => category === "semua" || item.kategori === category)
    .filter((item) => `${item.judul} ${item.penyebab}`.toLowerCase().includes(search.toLowerCase().trim()))
    .sort((a, b) => {
      if (sort === "bunga") return b.bunga - a.bunga;
      if (sort === "pendek") return getDurasiHari(a.tanggalMulai, a.tanggalMenyerah) - getDurasiHari(b.tanggalMulai, b.tanggalMenyerah);
      return new Date(b.tanggalMenyerah).getTime() - new Date(a.tanggalMenyerah).getTime();
    }), [makam, category, sort, search]);
  const visibleIds = useMemo(() => filtered.map((item) => item.id), [filtered]);
  const countdownTargets = useMemo(() => Object.values(bungaStatus).filter((status) => status.sudahMenabur && status.berlakuHingga).map((status) => status.berlakuHingga as string), [bungaStatus]);
  const countdowns = useWibCountdown(countdownTargets);
  useEffect(() => { void refreshPersonalStatus(user?.id, visibleIds); }, [user?.id, visibleIds, refreshPersonalStatus]);
  const flowerStatus = (id: string): "active" | "done" | "login" => !user ? "login" : bungaStatus[id]?.sudahMenabur ? "done" : "active";
  const flowerCountdown = (id: string) => { const target = bungaStatus[id]?.berlakuHingga; return target ? countdowns[target] : undefined; };

  return (
    <main id="top" className="relative min-h-screen overflow-hidden pb-20">
      <AmbientBackground />
      <Header onBury={() => requireLogin(() => setBuryOpen(true))} profile={user ? profile : undefined} onLogin={() => setLoginOpen(true)} onEditProfile={() => setProfileOpen(true)} onLogout={() => void signOut()} ctaVisible={heroCtaVisible} />
      {!configured && <div className="container-shell mt-2"><p role="status" className="status-banner">{process.env.NODE_ENV === "production" ? "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY." : "Mode lokal aktif untuk development. Login dan aksi tersimpan server menunggu konfigurasi Supabase."}</p></div>}
      <section className="container-shell pb-12 pt-8 sm:pb-20 sm:pt-12">
        <div className="hero-wrap hero-layout px-5 py-8 sm:px-10 sm:py-12">
          <HeroIllustration />
          <div className="hero-copy max-w-3xl">
            <p className="eyebrow">T P U · W A C A N A</p>
            <h1 className="mt-4 max-w-2xl text-display font-semibold tracking-[-.02em] text-[var(--text)]">Di sini, kegagalan punya tempat untuk pulang.</h1>
            <p className="mt-5 max-w-xl text-body text-[var(--text-muted)]">Tempat peristirahatan terakhir bagi wacana yang tak pernah terjadi. Tidak semua yang gagal harus dilupakan.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button ref={heroCtaRef} size="lg" onClick={() => requireLogin(() => setBuryOpen(true))}>+ Kuburkan wacana</Button>
              <Button size="lg" variant="secondary" onClick={() => document.getElementById("pemakaman")?.scrollIntoView({ behavior: "smooth" })}><ArrowDown size={18} aria-hidden="true" />Lihat pemakaman</Button>
            </div>
          </div>
        </div>
      </section>
      <section className="container-shell" aria-labelledby="stats-title">
        <h2 id="stats-title" className="sr-only">Statistik TPU Wacana</h2>
        <StatsBanner statistik={statistik} />
      </section>
      <section id="pemakaman" className="container-shell pt-16 sm:pt-24" aria-labelledby="graveyard-title">
        <div className="section-heading mb-8">
          <div>
            <p className="eyebrow">Koleksi kenangan</p>
            <h2 id="graveyard-title" className="mt-2 text-2xl font-semibold tracking-[-.03em] sm:text-3xl">Makam terbaru</h2>
          </div>
          <p className="font-mono text-xs text-[var(--text-muted)]">{filtered.length.toString().padStart(2, "0")} nisan</p>
        </div>
        <FilterBar category={category} sort={sort} search={search} onCategory={setCategory} onSort={setSort} onSearch={setSearch} />
        {error && <p role="alert" className="mt-5 rounded-xl border border-[color-mix(in_srgb,var(--danger)_40%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-4 py-3 text-sm text-[var(--danger)]">{error}</p>}
        <div className="mt-8">
          {loading ? <div className="panel rounded-2xl px-6 py-16 text-center text-sm text-[var(--text-muted)]">Menyiapkan tanah pemakaman...</div> : <TombstoneGrid makam={filtered} onSelect={setSelected} onFlower={(id) => requireLogin(() => void bunga(id))} onCandle={(id) => requireLogin(() => void lilin(id))} onBury={() => requireLogin(() => setBuryOpen(true))} highlightedId={highlightedId} flowerStatus={flowerStatus} flowerCountdown={flowerCountdown} candleMine={(id) => lilinSaya.has(id)} />}
        </div>
      </section>
      {selected && <GraveDetailModal makam={makam.find((item) => item.id === selected.id) ?? selected} onClose={() => setSelected(null)} onFlower={(id) => requireLogin(() => void bunga(id))} onCandle={(id) => requireLogin(() => void lilin(id))} onComment={(id, input) => new Promise((resolve, reject) => { if (!user) { setLoginOpen(true); reject(new Error("Masuk dulu untuk meninggalkan doa.")); return; } void komentar(id, input).then(resolve).catch(reject); })} flowerStatus={flowerStatus(selected.id)} flowerCountdown={flowerCountdown(selected.id)} candleMine={lilinSaya.has(selected.id)} />}
      {buryOpen && <BuryModal onClose={() => setBuryOpen(false)} onSubmit={kuburkan} onCreated={(newMakam) => { setBuryOpen(false); setHighlightedId(newMakam.id); window.setTimeout(() => setHighlightedId(null), 1900); window.setTimeout(() => setCertificate(newMakam), 900); }} />}
      {certificate && <DeathCertificateModal makam={certificate} onClose={() => setCertificate(null)} />}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      {profileOpen && user && <ProfileModal initialName={user.user_metadata.full_name ?? ""} onClose={() => setProfileOpen(false)} onSave={updateProfile} />}
    </main>
  );
}
