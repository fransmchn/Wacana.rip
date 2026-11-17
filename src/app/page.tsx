"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LoginModal } from "@/components/LoginModal";
import { AmbientBackground } from "@/components/AmbientBackground";
import { BuryModal } from "@/components/BuryModal";
import { DeathCertificateModal } from "@/components/DeathCertificateModal";
import { GraveDetailModal } from "@/components/GraveDetailModal";
import { FilterBar, type SortKey } from "@/components/FilterBar";
import { Header, ScrollCue } from "@/components/Header";
import { StatsBanner } from "@/components/StatsBanner";
import { TombstoneGrid } from "@/components/TombstoneGrid";
import { useGraveyard } from "@/hooks/useGraveyard";
import type { Kategori, Makam } from "@/types/graveyard";
import { getDurasiHari } from "@/lib/utils";
import { useWibCountdown } from "@/components/useWibCountdown";

export default function Home() {
  const { makam, statistik, loading, error, bunga, lilin, komentar, kuburkan, bungaStatus, lilinSaya, refreshPersonalStatus } = useGraveyard();
  const { user, configured, signOut } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [category, setCategory] = useState<"semua" | Kategori>("semua");
  const [sort, setSort] = useState<SortKey>("terbaru");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Makam | null>(null);
  const [buryOpen, setBuryOpen] = useState(false);
  const [certificate, setCertificate] = useState<Makam | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
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
      <Header onBury={() => requireLogin(() => setBuryOpen(true))} userName={user?.user_metadata.full_name ?? user?.email ?? undefined} onLogin={() => setLoginOpen(true)} onLogout={() => void signOut()} />
      {!configured && <div className="container-shell mt-2"><p role="status" className="rounded-xl border border-[#d8ad69]/30 bg-[#d8ad69]/10 px-4 py-3 text-sm text-[#d8ad69]">{process.env.NODE_ENV === "production" ? "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY." : "Mode lokal aktif untuk development. Login dan aksi tersimpan server menunggu konfigurasi Supabase."}</p></div>}
      <section className="container-shell pb-12 pt-8 sm:pb-20 sm:pt-12">
        <div className="hero-wrap px-5 py-8 sm:px-10 sm:py-12">
          <div className="hero-copy max-w-3xl">
            <p className="eyebrow">T P U · W A C A N A</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.04] tracking-[-.045em] text-[#f4f1e9] sm:mt-5 sm:text-6xl">Di sini, kegagalan punya tempat untuk pulang.</h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-[#a7a69f] sm:mt-6 sm:text-base sm:leading-7">Kuburkan ide, tugas, atau proyek yang kandas dengan layak. Tidak semua yang gagal harus dilupakan.</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <button onClick={() => requireLogin(() => setBuryOpen(true))} className="min-h-11 rounded-full bg-[#d87078] px-5 text-sm font-semibold text-[#211116] transition hover:-translate-y-0.5 hover:bg-[#f08c91]">+ Kuburkan wacana</button>
              <ScrollCue />
            </div>
          </div>
        </div>
      </section>
      <section className="container-shell" aria-labelledby="stats-title">
        <h2 id="stats-title" className="sr-only">Statistik TPU Wacana</h2>
        <StatsBanner statistik={statistik} />
      </section>
      <section id="pemakaman" className="container-shell pt-16 sm:pt-24" aria-labelledby="graveyard-title">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Koleksi kenangan</p>
            <h2 id="graveyard-title" className="mt-2 text-2xl font-semibold tracking-[-.03em] sm:text-3xl">Makam terbaru</h2>
          </div>
          <p className="font-mono text-xs text-[#6c6b67]">{filtered.length.toString().padStart(2, "0")} nisan</p>
        </div>
        <FilterBar category={category} sort={sort} search={search} onCategory={setCategory} onSort={setSort} onSearch={setSearch} />
        {error && <p role="alert" className="mt-5 rounded-xl border border-[#d87078]/40 bg-[#d87078]/10 px-4 py-3 text-sm text-[#f08c91]">{error}</p>}
        <div className="mt-8">
          {loading ? <div className="panel rounded-2xl px-6 py-16 text-center text-sm text-[#a7a69f]">Menyiapkan tanah pemakaman...</div> : <TombstoneGrid makam={filtered} onSelect={setSelected} onFlower={(id) => requireLogin(() => void bunga(id))} onCandle={(id) => requireLogin(() => void lilin(id))} onBury={() => requireLogin(() => setBuryOpen(true))} highlightedId={highlightedId} flowerStatus={flowerStatus} flowerCountdown={flowerCountdown} candleMine={(id) => lilinSaya.has(id)} />}
        </div>
      </section>
      {selected && <GraveDetailModal makam={makam.find((item) => item.id === selected.id) ?? selected} onClose={() => setSelected(null)} onFlower={(id) => requireLogin(() => void bunga(id))} onCandle={(id) => requireLogin(() => void lilin(id))} onComment={(id, input) => new Promise((resolve, reject) => { if (!user) { setLoginOpen(true); reject(new Error("Masuk dulu untuk meninggalkan doa.")); return; } void komentar(id, input).then(resolve).catch(reject); })} flowerStatus={flowerStatus(selected.id)} flowerCountdown={flowerCountdown(selected.id)} candleMine={lilinSaya.has(selected.id)} />}
      {buryOpen && <BuryModal onClose={() => setBuryOpen(false)} onSubmit={kuburkan} onCreated={(newMakam) => { setBuryOpen(false); setHighlightedId(newMakam.id); window.setTimeout(() => setHighlightedId(null), 1900); window.setTimeout(() => setCertificate(newMakam), 900); }} />}
      {certificate && <DeathCertificateModal makam={certificate} onClose={() => setCertificate(null)} />}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </main>
  );
}
