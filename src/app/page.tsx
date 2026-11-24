"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LoginModal } from "@/components/LoginModal";
import { ProfileModal } from "@/components/ProfileModal";
import { AmbientBackground } from "@/components/AmbientBackground";
import { BuryModal } from "@/components/BuryModal";
import { DeathCertificateModal } from "@/components/DeathCertificateModal";
import { GraveDetailModal } from "@/components/GraveDetailModal";
import { FilterBar, type SortKey } from "@/components/FilterBar";
import { Header } from "@/components/Header";
import { TombstoneGrid } from "@/components/TombstoneGrid";
import { Footer } from "@/components/Footer";
import { Select } from "@/components/ui/Select";
import { useGraveyard } from "@/hooks/useGraveyard";
import type { Kategori, Makam } from "@/types/graveyard";
import { getDurasiHari, getErosionInfo, type ErosionInfo } from "@/lib/utils";
import { useWibCountdown } from "@/components/useWibCountdown";
import { Button } from "@/components/ui/Button";
import { HeroIllustration } from "@/components/HeroIllustration";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/components/ui/Toast";

export default function Home() {
  const { makam, statistik, loading, error, bunga, lilin, komentar, kuburkan, bungaStatus, lilinSaya, refresh, refreshPersonalStatus } = useGraveyard();
  const { user, configured, signOut } = useAuth();
  const { toast } = useToast();
  const { profile: profileRecord, display: profile, mutate: mutateProfile } = useProfile(user);
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [category, setCategory] = useState<"semua" | Kategori>("semua");
  const [sort, setSort] = useState<SortKey>("terbaru");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Makam | null>(null);
  const [buryOpen, setBuryOpen] = useState(false);
  const [certificate, setCertificate] = useState<Makam | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [vipIds, setVipIds] = useState<Set<string>>(new Set());
  const heroCtaRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { const timer = window.setTimeout(() => setSearch(searchInput), 250); return () => window.clearTimeout(timer); }, [searchInput]);
  const [heroCtaVisible, setHeroCtaVisible] = useState(true);
  useEffect(() => { if (!heroCtaRef.current || !("IntersectionObserver" in window)) { setHeroCtaVisible(false); return; } const observer = new IntersectionObserver(([entry]) => setHeroCtaVisible(entry.isIntersecting), { threshold: .1 }); observer.observe(heroCtaRef.current); return () => observer.disconnect(); }, []);
  const requireLogin = (action: () => void) => { if (!user) { setLoginOpen(true); return; } action(); };
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("wacana-rip:vip");
      if (stored) setVipIds(new Set(JSON.parse(stored) as string[]));
    } catch { /*VIP lokal opsional; abaikan storage yang rusak.*/ }
  }, []);
  // Makam dengan bunga banyak tampil sebagai monumen Abadi di mode demo,
  // selain penanda vip dari data dan upgrade yang tersimpan lokal.
  const isVip = (item: Makam) => Boolean(item.vip) || vipIds.has(item.id) || item.bunga >= 20;
  const erosion = (item: Makam): ErosionInfo => getErosionInfo(item);
  const upgrade = (item: Makam) => requireLogin(() => {
    const next = new Set(vipIds).add(item.id);
    setVipIds(next);
    try { window.localStorage.setItem("wacana-rip:vip", JSON.stringify([...next])); } catch { /*tetap aktif untuk sesi ini*/ }
    toast("Makam Abadi aktif. Erosi dihentikan.", "success");
  });
  const runRitual = (action: () => Promise<void>, successMessage: string) => { void action().then(() => toast(successMessage, "success")).catch((reason) => toast(reason instanceof Error ? reason.message : "Ritual belum bisa dilakukan.", "danger")); };
  const filtered = useMemo(() => makam
    .filter((item) => category === "semua" || item.kategori === category)
    .filter((item) => `${item.judul} ${item.penyebab}`.toLowerCase().includes(search.toLowerCase().trim()))
    .sort((a, b) => {
      if (sort === "bunga") return b.bunga - a.bunga;
      if (sort === "lilin") return (b.lilinCount ?? (b.lilin ? 1 : 0)) - (a.lilinCount ?? (a.lilin ? 1 : 0));
      if (sort === "pendek") return getDurasiHari(a.tanggalMulai, a.tanggalMenyerah) - getDurasiHari(b.tanggalMulai, b.tanggalMenyerah);
      if (sort === "terlama") return new Date(a.tanggalMenyerah).getTime() - new Date(b.tanggalMenyerah).getTime();
      return new Date(b.tanggalMenyerah).getTime() - new Date(a.tanggalMenyerah).getTime();
    }), [makam, category, sort, search]);
  const visibleIds = useMemo(() => filtered.map((item) => item.id), [filtered]);
  const countdownTargets = useMemo(() => Object.values(bungaStatus).filter((status) => status.sudahMenabur && status.berlakuHingga).map((status) => status.berlakuHingga as string), [bungaStatus]);
  const countdowns = useWibCountdown(countdownTargets);
  useEffect(() => { void refreshPersonalStatus(user?.id, visibleIds); }, [user?.id, visibleIds, refreshPersonalStatus]);
  const flowerStatus = (id: string): "active" | "done" | "login" => !user ? "login" : bungaStatus[id]?.sudahMenabur ? "done" : "active";
  const flowerCountdown = (id: string) => { const target = bungaStatus[id]?.berlakuHingga; return target ? countdowns[target] : undefined; };
  const hasFilter = category !== "semua" || search.trim().length > 0;
  const resetFilters = () => { setCategory("semua"); setSearchInput(""); setSort("terbaru"); };

  return (
    <main id="main" className="relative min-h-screen overflow-hidden pb-20">
      <AmbientBackground />
      <Header onBury={() => requireLogin(() => setBuryOpen(true))} profile={user ? profile : undefined} onLogin={() => setLoginOpen(true)} onEditProfile={() => setProfileOpen(true)} onLogout={() => void signOut()} ctaVisible={heroCtaVisible} />
      {!configured && <div className="container-shell mt-2"><p role="status" className="status-banner">{process.env.NODE_ENV === "production" ? "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY." : "Mode lokal aktif untuk development. Login dan aksi tersimpan server menunggu konfigurasi Supabase."}</p></div>}
      <section className="container-shell pb-12 pt-8 sm:pb-20 sm:pt-12">
        <div className="hero-wrap hero-layout px-5 py-8 sm:px-10 sm:py-12">
          <div className="hero-copy max-w-3xl">
            <p className="eyebrow">T P U · W A C A N A</p>
            <h1 className="mt-4 max-w-2xl text-display font-semibold tracking-[-.02em] text-[var(--text)]">Di sini, kegagalan punya tempat untuk pulang.</h1>
            <p className="mt-5 max-w-xl text-body text-[var(--text-muted)]">Tempat peristirahatan terakhir bagi wacana yang tak pernah terjadi. Tidak semua yang gagal harus dilupakan.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button ref={heroCtaRef} size="lg" onClick={() => requireLogin(() => setBuryOpen(true))}><Plus size={18} strokeWidth={2.5} aria-hidden="true" />Kuburkan wacana</Button>
              <Button size="lg" variant="secondary" onClick={() => document.getElementById("pemakaman")?.scrollIntoView({ behavior: "smooth" })}><ArrowDown size={18} aria-hidden="true" />Lihat pemakaman</Button>
            </div>
          </div>
          <HeroIllustration statistik={statistik} />
        </div>
      </section>
      <section id="pemakaman" className="container-shell pt-16 sm:pt-24" aria-labelledby="graveyard-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Koleksi kenangan</p>
            <h2 id="graveyard-title" className="section-title">Makam terbaru</h2>
            <p className="section-whisper">Jelajahi petak demi petak. Arahkan cahaya, nyalakan lilin, taburkan bunga.</p>
          </div>
          <div className="section-tools">
            <p className="result-count" aria-live="polite">{filtered.length} makam</p>
            <Select aria-label="Urutkan makam" value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
              <option value="terbaru">Terbaru gugur</option><option value="terlama">Terlama</option><option value="bunga">Paling banyak bunga</option><option value="lilin">Paling banyak lilin</option><option value="pendek">Umur terpendek</option>
            </Select>
          </div>
        </div>
        <FilterBar category={category} search={searchInput} onCategory={setCategory} onSearch={setSearchInput} />
        <p className="sr-only" aria-live="polite">{filtered.length} makam ditemukan</p>
        <div className="graveyard-ground">
          <div className="graveyard-horizon" aria-hidden="true" />
          <TombstoneGrid loading={loading} error={error} onRetry={() => void refresh()} hasFilter={hasFilter} onResetFilter={resetFilters} makam={filtered} onSelect={setSelected} onFlower={(id) => requireLogin(() => runRitual(() => bunga(id), "Bunga berhasil ditaburkan."))} onCandle={(id) => requireLogin(() => runRitual(() => lilin(id), "Lilin berhasil dinyalakan."))} onBury={() => requireLogin(() => setBuryOpen(true))} highlightedId={highlightedId} flowerStatus={flowerStatus} flowerCountdown={flowerCountdown} candleMine={(id) => lilinSaya.has(id)} isVip={isVip} erosion={erosion} />
        </div>
      </section>
      {selected && <GraveDetailModal makam={makam.find((item) => item.id === selected.id) ?? selected} onClose={() => setSelected(null)} onFlower={(id) => requireLogin(() => runRitual(() => bunga(id), "Bunga berhasil ditaburkan."))} onCandle={(id) => requireLogin(() => runRitual(() => lilin(id), "Lilin berhasil dinyalakan."))} onComment={(id, input) => new Promise((resolve, reject) => { if (!user) { setLoginOpen(true); reject(new Error("Masuk dulu untuk meninggalkan doa.")); return; } void komentar(id, input).then(resolve).catch(reject); })} flowerStatus={flowerStatus(selected.id)} flowerCountdown={flowerCountdown(selected.id)} candleMine={lilinSaya.has(selected.id)} vip={isVip(selected)} erosion={erosion(selected)} onUpgrade={upgrade} />}
      {buryOpen && <BuryModal onClose={() => setBuryOpen(false)} onSubmit={kuburkan} onCreated={(newMakam) => { setBuryOpen(false); setHighlightedId(newMakam.id); window.setTimeout(() => setHighlightedId(null), 1900); window.setTimeout(() => setCertificate(newMakam), 900); }} />}
      {certificate && <DeathCertificateModal makam={certificate} onClose={() => setCertificate(null)} />}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      {profileOpen && user && <ProfileModal user={user} profile={profileRecord} onClose={() => setProfileOpen(false)} onSave={async (patch) => { await mutateProfile(patch); }} onLogout={() => void signOut()} />}
      <Footer />
    </main>
  );
}
