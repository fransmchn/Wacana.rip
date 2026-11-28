"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LoginModal } from "@/components/LoginModal";
import { ProfileModal } from "@/components/ProfileModal";
import { AmbientBackground } from "@/components/AmbientBackground";
import { BuryModal } from "@/components/BuryModal";
import { GraveDetailModal } from "@/components/GraveDetailModal";
import { StoryStudioModal } from "@/components/StoryStudioModal";
import { Footer } from "@/components/Footer";
import { ExhibitionDock } from "@/components/ExhibitionDock";
import { ExhibitionHUD } from "@/components/ExhibitionHUD";
import { MemorialPark } from "@/components/MemorialPark";
import { Button } from "@/components/ui/Button";
import { HeroIllustration } from "@/components/HeroIllustration";
import { useGraveyard } from "@/hooks/useGraveyard";
import { useClientNow } from "@/hooks/useClientNow";
import type { CreateMakamInput, Kategori, Makam, NisanTema, SortKey } from "@/types/graveyard";
import { persistVipUpgrade } from "@/lib/graveyardService";
import { getDurasiHari, getErosionInfo, type ErosionInfo } from "@/lib/utils";
import { DEFAULT_TEMA } from "@/lib/themes";
import { resolveTheme } from "@/lib/themeService";
import { useWibCountdown } from "@/components/useWibCountdown";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/components/ui/Toast";
import { useVipUpgrade } from "@/components/VipUpgradeProvider";

export default function Home() {
  const { makam, statistik, loading, error, bunga, komentar, kuburkan, bungaStatus, refresh, refreshPersonalStatus } = useGraveyard();
  const { user, configured, authError, clearAuthError, signOut } = useAuth();
  const { toast } = useToast();
  const { isVip, requestUpgrade } = useVipUpgrade();
  const router = useRouter();
  const now = useClientNow();
  const { profile: profileRecord, display: profile, mutate: mutateProfile } = useProfile(user);
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [category, setCategory] = useState<"semua" | Kategori>("semua");
  const [sort, setSort] = useState<SortKey>("terbaru");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Makam | null>(null);
  const [buryOpen, setBuryOpen] = useState(false);
  const [burySession, setBurySession] = useState(0);
  const [storyTarget, setStoryTarget] = useState<Makam | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!authError) return;
    toast(authError, "danger");
    clearAuthError();
  }, [authError, clearAuthError, toast]);

  const requireLogin = (action: () => void) => {
    if (!user) { setLoginOpen(true); return; }
    action();
  };
  const openBury = () => requireLogin(() => { setBurySession((session) => session + 1); setBuryOpen(true); });
  const erosion = (item: Makam): ErosionInfo => getErosionInfo(item, now);

  const upgrade = (item: Makam) => requireLogin(() => requestUpgrade(item, {
    userId: user?.id,
    userEmail: user?.email,
    userName: profile.name,
    onPaid: async (result) => {
      await refresh();
      setSelected((current) =>
        current && current.id === item.id
          ? { ...current, vip: true, tema: result.transaction.params.selectedTheme }
          : current,
      );
      setHighlightedId(item.id);
      window.setTimeout(() => setHighlightedId(null), 2200);
    },
  }));

  function afterCreate(newMakam: Makam) {
    setBuryOpen(false);
    setHighlightedId(newMakam.id);
    window.setTimeout(() => setHighlightedId(null), 1900);
    window.setTimeout(() => setStoryTarget(newMakam), 900);
  }

  /**
   * Anti-Bypass VIP Creation Flow:
   * 1. Simpan makam terlebih dahulu sebagai Free tier (`is_vip: false`, `tema: batu-lapuk`).
   * 2. Langsung buka CheckoutModal untuk `graveId` asli dengan tema VIP terpilih.
   * 3. Hanya naik ke VIP + tema VIP di `onPaid` setelah pembayaran sukses.
   *    Jika user batal/tutup modal, makam tetap aman di Lembah Perjuangan (Free).
   */
  const vipThemeRequest = async (input: CreateMakamInput) => {
    if (!user) { setLoginOpen(true); return; }
    const created = await kuburkan({
      ...input,
      tema: DEFAULT_TEMA,
      vip: false,
    });
    setBuryOpen(false);
    requestUpgrade(created, {
      selectedTheme: input.tema,
      userId: user.id,
      userEmail: user.email,
      userName: profile.name,
      onPaid: async (result) => {
        const chosenTheme = result.transaction.params.selectedTheme;
        await refresh();
        afterCreate({ ...created, tema: chosenTheme, vip: true });
      },
      onCancel: () => {
        toast("Makam disimpan di Lembah Perjuangan (Batu Lapuk). Kamu bisa upgrade ke VIP kapan saja.", "info");
        setHighlightedId(created.id);
        window.setTimeout(() => setHighlightedId(null), 2200);
      },
    });
  };

  const runRitual = (action: () => Promise<void>) => {
    void action()
      .then(() => toast("Bunga ditaburkan ke makam ini", "success"))
      .catch((reason) => toast(reason instanceof Error ? reason.message : "Ritual belum bisa dilakukan.", "danger"));
  };

  const filtered = useMemo(() => makam
    .filter((item) => category === "semua" || item.kategori === category)
    .filter((item) => `${item.judul} ${item.penyebab}`.toLowerCase().includes(search.toLowerCase().trim()))
    .sort((a, b) => {
      if (sort === "bunga") return b.bunga - a.bunga;
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
  const resetFilters = () => { setCategory("semua"); setSearchInput(""); setSearch(""); setSort("terbaru"); };
  const resetHomeView = () => {
    resetFilters();
    setSelected(null);
    setBuryOpen(false);
    setStoryTarget(null);
    setLoginOpen(false);
    setProfileOpen(false);
  };
  const switchVipTheme = async (item: Makam, tema: NisanTema) => {
    await persistVipUpgrade(item.id, tema);
    await refresh();
    setSelected((current) => (current && current.id === item.id ? { ...current, tema } : current));
  };

  const openStory = (item: Makam) => setStoryTarget(makam.find((entry) => entry.id === item.id) ?? item);

  function randomPilgrimage() {
    if (!filtered.length) return;
    const target = filtered[Math.floor(Math.random() * filtered.length)];
    setHighlightedId(target.id);
    window.setTimeout(() => {
      const node = [...document.querySelectorAll<HTMLElement>("[data-grave-id]")]
        .find((element) => element.dataset.graveId === target.id);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      node?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center", inline: "center" });
    }, 0);
    window.setTimeout(() => setHighlightedId(null), 2600);
  }

  return (
    <main id="main" className="relative min-h-screen overflow-hidden pb-20">
      <AmbientBackground />
      <ExhibitionHUD
        statistik={statistik}
        profile={user ? profile : undefined}
        onHome={resetHomeView}
        onBury={() => openBury()}
        onLogin={() => setLoginOpen(true)}
        onProfile={() => router.push("/profile")}
        onEditProfile={() => setProfileOpen(true)}
        onLogout={() => void signOut()}
      />
      {!configured && <div className="container-shell"><p role="status" className="status-banner">{process.env.NODE_ENV === "production" ? "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY." : "Mode lokal aktif untuk development. Login dan aksi tersimpan server menunggu konfigurasi Supabase."}</p></div>}

      <section className="container-shell hero-section pb-12 pt-28 sm:pb-20 sm:pt-32">
        <div className="hero-wrap hero-layout px-5 py-8 sm:px-10 sm:py-12">
          <div className="hero-copy max-w-3xl">
            <p className="eyebrow">G R A V E Y A R D · R I P</p>
            <h1 className="mt-4 max-w-2xl text-display font-semibold tracking-[-.02em] text-[var(--text)]">Di sini, kegagalan punya tempat untuk pulang.</h1>
            <p className="mt-5 max-w-xl text-body text-[var(--text-muted)]">Monumen Digital bagi Mimpi, Skripsi, dan Rencana yang Gugur di Medan Juang.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={() => openBury()}><Plus size={18} strokeWidth={2.5} aria-hidden="true" />Kuburkan Mimpi</Button>
              <Button size="lg" variant="secondary" onClick={() => document.getElementById("pemakaman")?.scrollIntoView({ behavior: "smooth" })}><ArrowDown size={18} aria-hidden="true" />Jelajahi pemakaman</Button>
            </div>
          </div>
          <HeroIllustration statistik={statistik} />
        </div>
      </section>

      <MemorialPark
        makam={filtered}
        loading={loading}
        error={error}
        hasFilter={hasFilter}
        sort={sort}
        highlightedId={highlightedId}
        flowerStatus={flowerStatus}
        flowerCountdown={flowerCountdown}
        isVip={isVip}
        erosion={erosion}
        onRetry={() => void refresh()}
        onResetFilter={resetFilters}
        onSort={setSort}
        onSelect={setSelected}
        onFlower={(id) => requireLogin(() => runRitual(() => bunga(id)))}
        onBury={() => openBury()}
      />
      <ExhibitionDock
        category={category}
        search={searchInput}
        count={filtered.length}
        onCategory={setCategory}
        onSearch={setSearchInput}
        onRandom={randomPilgrimage}
      />

      {selected && (() => {
        const active = makam.find((item) => item.id === selected.id) ?? selected;
        const activeVip = isVip(active);
        const canEditVip = activeVip && (!configured || !active.userId || active.userId === user?.id);
        return (
          <GraveDetailModal
            makam={active}
            onClose={() => setSelected(null)}
            onFlower={(id) => requireLogin(() => runRitual(() => bunga(id)))}
            onComment={(id, input) => new Promise((resolve, reject) => { if (!user) { setLoginOpen(true); reject(new Error("Masuk dulu untuk meninggalkan doa.")); return; } void komentar(id, input).then(resolve).catch(reject); })}
            flowerStatus={flowerStatus(active.id)}
            flowerCountdown={flowerCountdown(active.id)}
            vip={activeVip}
            erosion={erosion(active)}
            onUpgrade={upgrade}
            onOpenStory={openStory}
            onSwitchVipTheme={switchVipTheme}
            canEditVip={canEditVip}
          />
        );
      })()}
      {buryOpen && <BuryModal key={burySession} onClose={() => setBuryOpen(false)} onSubmit={kuburkan} onCreated={afterCreate} onVipTheme={vipThemeRequest} defaultAuthor={user ? profile.name : ""} />}
      {storyTarget && (() => {
        const activeStory = makam.find((item) => item.id === storyTarget.id) ?? storyTarget;
        return (
          <StoryStudioModal
            makam={activeStory}
            vip={isVip(activeStory)}
            theme={resolveTheme(activeStory)}
            onClose={() => setStoryTarget(null)}
            onUpgrade={(target) => { setStoryTarget(null); upgrade(target); }}
          />
        );
      })()}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      {profileOpen && user && <ProfileModal user={user} profile={profileRecord} onClose={() => setProfileOpen(false)} onSave={async (patch) => { await mutateProfile(patch); }} onLogout={() => void signOut()} />}
      <Footer />
    </main>
  );
}
