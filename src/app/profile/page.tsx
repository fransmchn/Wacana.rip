"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Crown, Flower2, Hourglass, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { AmbientBackground } from "@/components/AmbientBackground";
import { BuryModal } from "@/components/BuryModal";
import { DigUpConfirmModal } from "@/components/DigUpConfirmModal";
import { EditGraveModal } from "@/components/EditGraveModal";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LoginModal } from "@/components/LoginModal";
import { ProfileModal } from "@/components/ProfileModal";
import { StoryStudioModal } from "@/components/StoryStudioModal";
import { useVipUpgrade } from "@/components/VipUpgradeProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useClientNow } from "@/hooks/useClientNow";
import { useProfile } from "@/hooks/useProfile";
import { createMakam, hapusMakam, listMakamSaya, updateMakam } from "@/lib/graveyardService";
import { createDraftGrave, replaceVipId } from "@/lib/payment";
import { resolveTheme } from "@/lib/themeService";
import { getTemaNisan } from "@/lib/themes";
import { formatCompactRupiah, formatKerugian, formatRupiahLengkap, formatTanggal, getErosionInfo, getTierDuka } from "@/lib/utils";
import type { CreateMakamInput, EditMakamInput, Kategori, Makam } from "@/types/graveyard";

type FilterKey = "semua" | "aktif" | "vip" | "gugur";
const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "semua", label: "Semua" },
  { key: "aktif", label: "Aktif" },
  { key: "vip", label: "VIP Abadi" },
  { key: "gugur", label: "Hampir Gugur" },
];

const categoryLabel: Record<Kategori, string> = {
  skripsi: "Skripsi & riset", koding: "Koding & teknologi", desain: "Desain & karya",
  bisnis: "Bisnis & usaha", resolusi: "Resolusi & hobi", hubungan: "Hubungan",
  pribadi: "Hal pribadi", pekerjaan: "Pekerjaan & karier", keluarga: "Keluarga",
  kesehatan: "Kesehatan", perjalanan: "Perjalanan", lainnya: "Lainnya",
};

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, configured, loading: authLoading, signOut } = useAuth();
  const { profile: profileRecord, display: profile, mutate: mutateProfile } = useProfile(user);
  const { vipIds, isVip, requestUpgrade } = useVipUpgrade();
  const now = useClientNow();

  const [graves, setGraves] = useState<Makam[]>([]);
  const [loadingGraves, setLoadingGraves] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("semua");
  const [loginOpen, setLoginOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [buryOpen, setBuryOpen] = useState(false);
  const [burySession, setBurySession] = useState(0);
  const [editTarget, setEditTarget] = useState<Makam | null>(null);
  const [digTarget, setDigTarget] = useState<Makam | null>(null);
  const [storyTarget, setStoryTarget] = useState<Makam | null>(null);

  const needLogin = configured && !user;
  const ownerId = configured ? user?.id : undefined;

  const load = useCallback(async () => {
    if (configured && !user) { setGraves([]); setLoadingGraves(false); return; }
    setLoadingGraves(true);
    try {
      setGraves(await listMakamSaya(ownerId));
      setLoadError(null);
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : "Daftar makam gagal dimuat.");
    } finally { setLoadingGraves(false); }
  }, [configured, ownerId, user]);
  useEffect(() => { void load(); }, [load]);

  const stats = useMemo(() => graves.reduce((total, grave) => ({
    dikubur: total.dikubur + 1,
    kerugian: total.kerugian + (grave.kerugianRupiah ?? 0),
    bunga: total.bunga + grave.bunga,
    vip: total.vip + (isVip(grave) ? 1 : 0),
  }), { dikubur: 0, kerugian: 0, bunga: 0, vip: 0 }), [graves, isVip]);

  const filtered = useMemo(() => graves.filter((grave) => {
    if (filter === "semua") return true;
    const vip = isVip(grave);
    if (filter === "vip") return vip;
    if (vip) return false;
    const daysLeft = getErosionInfo(grave, now).daysLeft;
    if (filter === "aktif") return daysLeft > 2;
    if (filter === "gugur") return daysLeft <= 2;
    return true;
  }), [graves, filter, isVip, now]);

  const vipUnlocked = vipIds.length > 0 || graves.some((grave) => isVip(grave));
  const requireLogin = (action: () => void) => { if (needLogin) { setLoginOpen(true); return; } action(); };
  const openBury = () => requireLogin(() => { setBurySession((session) => session + 1); setBuryOpen(true); });
  const erosion = (grave: Makam) => getErosionInfo(grave, now);

  async function persistGrave(input: CreateMakamInput, options: { silent?: boolean; vip?: boolean } = {}): Promise<Makam> {
    const created = await createMakam(options.vip ? { ...input, vip: true } : input);
    setGraves((current) => [created, ...current]);
    setBuryOpen(false);
    setFilter("semua");
    if (!options.silent) toast("Mimpi berhasil dikubur di petakmu.", "success");
    return created;
  }

  function afterCreate(created: Makam) {
    window.setTimeout(() => setStoryTarget(created), 700);
  }

  const vipThemeRequest = (input: CreateMakamInput) => requireLogin(() => {
    const draft = createDraftGrave(input);
    requestUpgrade(draft, {
      selectedTheme: input.tema,
      userId: ownerId,
      onPaid: async (result) => {
        const chosenTheme = result.transaction.params.selectedTheme;
        const created = await persistGrave({ ...input, tema: chosenTheme }, { silent: true, vip: true });
        replaceVipId(result.graveId, created.id);
        await load();
        afterCreate(created);
      },
    });
  });

  const upgrade = (grave: Makam) => requireLogin(() => requestUpgrade(grave, {
    userId: ownerId,
    onPaid: async () => { await load(); },
  }));

  const upgradeTheme = (input: EditMakamInput) => requireLogin(() => {
    if (!editTarget) return;
    const target = editTarget;
    requestUpgrade(target, {
      selectedTheme: input.tema,
      userId: ownerId,
      onPaid: async (result) => {
        const chosenTheme = result.transaction.params.selectedTheme;
        const updated = await updateMakam(target.id, { ...input, tema: chosenTheme }, ownerId);
        setGraves((current) => current.map((grave) => grave.id === updated.id ? updated : grave));
        setEditTarget(null);
        await load();
        toast("Tema VIP permanen dipasang.", "success");
      },
    });
  });

  async function saveEdit(input: EditMakamInput) {
    if (!editTarget) return;
    const updated = await updateMakam(editTarget.id, input, ownerId);
    setGraves((current) => current.map((grave) => grave.id === updated.id ? updated : grave));
  }

  async function digUp() {
    if (!digTarget) return;
    await hapusMakam(digTarget.id, ownerId);
    setGraves((current) => current.filter((grave) => grave.id !== digTarget.id));
  }

  const showSkeleton = authLoading || (loadingGraves && !needLogin);

  return (
    <main id="main" className="profile-page relative min-h-screen overflow-hidden pb-20">
      <AmbientBackground />
      <Header onBury={openBury} profile={user ? profile : undefined} onLogin={() => setLoginOpen(true)} onProfile={() => router.push("/profile")} onEditProfile={() => setProfileOpen(true)} onLogout={() => void signOut()} />

      <div className="container-shell profile-shell">
        <Link href="/" className="profile-back"><ArrowLeft size={15} aria-hidden="true" />Kembali ke pemakaman</Link>

        <section className="profile-hero" aria-labelledby="profile-title">
          <div className="profile-identity">
            <p className="eyebrow">Arsip pribadi · GRAVEYARD</p>
            <h1 id="profile-title" className="text-display">Petak milik {profile?.name ?? "penjaga GRAVEYARD"}.</h1>
            <p className="section-whisper">Semua mimpi yang pernah kamu kubur, berikut keadaan monumnya hari ini.</p>
          </div>
          <div className="profile-hero-actions">
            {needLogin ? <Button onClick={() => setLoginOpen(true)}>Masuk untuk mengelola</Button> : <Button onClick={openBury}><Plus size={17} aria-hidden="true" />Kuburkan Mimpi</Button>}
          </div>
        </section>

        {!configured && <p role="status" className="status-banner">Mode lokal aktif. Makam yang dibuat di peramban ini tampil sebagai milikmu.</p>}
        {loadError && <p role="alert" className="status-banner status-banner-danger">{loadError} <button type="button" onClick={() => void load()}>Coba lagi</button></p>}

        <section className="profile-summary" aria-label="Ringkasan profil">
          {showSkeleton ? Array.from({ length: 5 }, (_, index) => <div key={index} className="summary-stat"><Skeleton className="skeleton-stat-label" /><Skeleton className="skeleton-stat-value" /></div>) : <>
            <StatCard label="Total mimpi dikubur" value={String(stats.dikubur)} note="petak terisi" icon={<Flower2 size={16} />} />
            <StatCard label="Total kerugian tercatat" value={formatCompactRupiah(stats.kerugian)} note={stats.kerugian ? formatRupiahLengkap(stats.kerugian) : "belum dihitung"} icon={<Hourglass size={16} />} />
            <StatCard label="Total bunga diterima" value={String(stats.bunga)} note="taburan dari pengunjung" icon={<Flower2 size={16} />} />
            <StatCard label="Peringkat Duka" value={getTierDuka(stats.dikubur, stats.bunga, stats.vip)} note={`${stats.bunga} taburan · ${stats.vip} abadi`} icon={<Sparkles size={16} />} />
            <div className="summary-stat summary-stat-vip">
              <span className="summary-stat-label">Tier Terkuat</span>
              <Badge tone={stats.vip > 0 ? "gold" : "neutral"}>{stats.vip > 0 ? <><Crown size={12} aria-hidden="true" />Abadi Aktif</> : "Makam Biasa"}</Badge>
              <span className="summary-stat-note">{stats.vip} makam diabadikan</span>
            </div>
          </>}
        </section>

        <section className="profile-graves" aria-labelledby="my-graves-title">
          <div className="profile-graves-head">
            <div><p className="eyebrow">Kelola petak</p><h2 id="my-graves-title" className="section-title">Makam saya</h2></div>
            <p className="result-count" aria-live="polite">{filtered.length} dari {graves.length} makam</p>
          </div>

          <div className="profile-filters" role="group" aria-label="Filter makam">
            {FILTERS.map((option) => <button key={option.key} type="button" className={`profile-filter ${filter === option.key ? "profile-filter-active" : ""}`} aria-pressed={filter === option.key} onClick={() => setFilter(option.key)}>{option.label}</button>)}
          </div>

          {showSkeleton ? <div className="my-grave-list">{[0, 1].map((index) => <div key={index} className="my-grave my-grave-skeleton"><Skeleton className="skeleton-grave-title" /><Skeleton className="skeleton-grave-line" /><Skeleton className="skeleton-grave-line-short" /></div>)}</div> : null}

          {!showSkeleton && graves.length === 0 && <EmptyState icon={<Flower2 size={20} aria-hidden="true" />} title="Belum ada mimpi yang dikubur" description="Petakmu masih kosong. Kuburkan mimpi pertama dan beri dia tempat untuk pulang." actionLabel="Kuburkan mimpi pertama" onAction={() => requireLogin(() => setBuryOpen(true))} />}

          {!showSkeleton && graves.length > 0 && filtered.length === 0 && <EmptyState icon={<Hourglass size={20} aria-hidden="true" />} title="Tidak ada makam di kategori ini" description="Coba filter lain untuk melihat petak yang masih tersimpan." actionLabel="Lihat semua makam" onAction={() => setFilter("semua")} />}

          {!showSkeleton && filtered.length > 0 && <div className="my-grave-list">
            {filtered.map((grave) => {
              const vip = isVip(grave);
              const info = erosion(grave);
              return <article key={grave.id} className={`my-grave ${vip ? "my-grave-vip" : ""}`}>
                <div className="my-grave-head">
                  <div className="my-grave-heading">
                    <span className="my-grave-kicker">{categoryLabel[grave.kategori]} · {formatTanggal(grave.tanggalMenyerah)}</span>
                    <h3>{grave.judul}</h3>
                  </div>
                  {vip ? <Badge tone="gold"><Crown size={12} aria-hidden="true" />Abadi</Badge> : <Badge tone="danger"><Hourglass size={12} aria-hidden="true" />{info.label}</Badge>}
                </div>
                <p className="my-grave-epitaph">“{grave.epitaph}”</p>
                <dl className="my-grave-meta">
                  <div><dt>Bunga</dt><dd>{grave.bunga}</dd></div>
                  <div><dt>Nisan</dt><dd>{getTemaNisan(resolveTheme(grave)).label}</dd></div>
                  <div><dt>Kerugian</dt><dd>{formatKerugian(grave)}</dd></div>
                </dl>
                {!vip && <div className="my-grave-erosion"><div className="erosion-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={info.progress} aria-label={info.label}><span style={{ width: `${info.progress}%` }} /></div><span>{info.progress}% erosi</span></div>}
                <div className="my-grave-actions">
                  <Button size="sm" variant="ghost" onClick={() => setEditTarget(grave)}><Pencil size={14} aria-hidden="true" />Edit</Button>
                  <Button size="sm" variant="secondary" onClick={() => setStoryTarget(grave)}><Sparkles size={14} aria-hidden="true" />Story / Akta</Button>
                  {!vip && <Button size="sm" variant="secondary" onClick={() => upgrade(grave)}><Crown size={14} aria-hidden="true" />Abadikan (VIP)</Button>}
                  <Button size="sm" variant="danger" onClick={() => setDigTarget(grave)}><Trash2 size={14} aria-hidden="true" />Gali Kembali</Button>
                </div>
              </article>;
            })}
          </div>}
        </section>
      </div>

      <Footer />
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
      {profileOpen && user && <ProfileModal user={user} profile={profileRecord} onClose={() => setProfileOpen(false)} onSave={async (patch) => { await mutateProfile(patch); }} onLogout={() => void signOut()} />}
      {buryOpen && <BuryModal key={burySession} onClose={() => setBuryOpen(false)} onSubmit={(input) => persistGrave(input)} onCreated={afterCreate} vipUnlocked={vipUnlocked} onVipTheme={vipThemeRequest} />}
      {editTarget && <EditGraveModal makam={editTarget} onClose={() => setEditTarget(null)} onSave={saveEdit} vipUnlocked={vipUnlocked} onUpgradeTheme={upgradeTheme} />}
      {digTarget && <DigUpConfirmModal makam={digTarget} onClose={() => setDigTarget(null)} onConfirm={digUp} />}
      {storyTarget && <StoryStudioModal makam={graves.find((grave) => grave.id === storyTarget.id) ?? storyTarget} vip={isVip(storyTarget)} theme={resolveTheme(storyTarget)} onClose={() => setStoryTarget(null)} />}
    </main>
  );
}

function StatCard({ label, value, note, icon }: { label: string; value: string; note: string; icon: ReactNode }) {
  return <div className="summary-stat"><span className="summary-stat-label">{label}</span><strong className="summary-stat-value">{value}</strong><span className="summary-stat-note">{icon}{note}</span></div>;
}
