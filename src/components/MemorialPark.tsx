"use client";

import { useEffect } from "react";
import { ArrowUpRight, Landmark, Route } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Monument } from "@/components/Monument";
import { usePointerGlow } from "@/hooks/usePointerGlow";
import type { SortKey } from "@/components/FilterBar";
import type { Makam } from "@/types/graveyard";
import type { ErosionInfo } from "@/lib/utils";

interface MemorialParkProps {
  makam: Makam[];
  loading: boolean;
  error: string | null;
  hasFilter: boolean;
  sort: SortKey;
  highlightedId: string | null;
  flowerStatus: (id: string) => "active" | "done" | "login";
  flowerCountdown: (id: string) => string | undefined;
  isVip: (makam: Makam) => boolean;
  erosion: (makam: Makam) => ErosionInfo;
  onRetry: () => void;
  onResetFilter: () => void;
  onSort: (value: SortKey) => void;
  onSelect: (makam: Makam) => void;
  onFlower: (id: string) => void;
  onBury: () => void;
}

/** 2.5D cemetery grounds: two hills, static winding paths, sculptural monuments. */
export function MemorialPark({
  makam, loading, error, hasFilter, sort, highlightedId,
  flowerStatus, flowerCountdown, isVip, erosion,
  onRetry, onResetFilter, onSort, onSelect, onFlower, onBury,
}: MemorialParkProps) {
  const canvasRef = usePointerGlow<HTMLDivElement>("element");
  const landmarks = makam.filter(isVip);

  useEffect(() => {
    if (!highlightedId || !canvasRef.current) return;
    const target = [...canvasRef.current.querySelectorAll<HTMLElement>("[data-grave-id]")]
      .find((element) => element.dataset.graveId === highlightedId);
    if (!target) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center", inline: "center" });
  }, [highlightedId, canvasRef]);

  return (
    <section id="pemakaman" className="memorial-section" aria-labelledby="grounds-title">
      <div className="container-shell grounds-intro">
        <div>
          <p className="eyebrow">Area Pemakaman</p>
          <h2 id="grounds-title" className="section-title">Peta monumen yang pernah bermimpi</h2>
          <p className="section-whisper">Dua kawasan, satu cahaya bulan. Arahkan senter, baca ukiran, lalu taburkan bunga.</p>
        </div>
        <div className="section-tools">
          <p className="result-count" aria-live="polite">{makam.length} monumen</p>
          <Select aria-label="Urutkan monumen" value={sort} onChange={(event) => onSort(event.target.value as SortKey)}>
            <option value="terbaru">Terbaru gugur</option>
            <option value="terlama">Terlama</option>
            <option value="bunga">Paling banyak bunga</option>
            <option value="pendek">Umur terpendek</option>
          </Select>
        </div>
      </div>

      <div className="container-shell ground-canvas" ref={canvasRef}>
        <div className="ground-sky" aria-hidden="true" />
        <div className="ground-moon" aria-hidden="true" />
        <div className="ground-horizon" aria-hidden="true" />
        <div className="ground-plane ground-plane-back" aria-hidden="true" />
        <div className="ground-plane ground-plane-front" aria-hidden="true" />
        <div className="ground-flashlight" aria-hidden="true" />
        <svg className="ground-pathways" viewBox="0 0 1200 1040" preserveAspectRatio="none" aria-hidden="true">
          <path className="path-trunk" d="M600 1040 C 590 860, 470 760, 520 610 C 560 480, 430 360, 360 190" />
          <path className="path-trunk" d="M600 1040 C 640 850, 780 770, 720 600 C 670 450, 820 350, 900 210" />
          <path className="path-branch" d="M520 610 C 360 580, 250 500, 140 420" />
          <path className="path-branch" d="M720 600 C 880 570, 990 500, 1090 430" />
          <path className="path-branch" d="M360 190 C 300 140, 250 110, 180 90" />
          <path className="path-branch" d="M900 210 C 960 150, 1010 120, 1080 100" />
        </svg>

        {error && (
          <div className="container-shell ground-alert">
            <EmptyState
              icon={<Route size={20} aria-hidden="true" />}
              title="Jalan ke pemakaman tertutup kabut"
              description={error}
              actionLabel="Coba lagi"
              onAction={onRetry}
            />
          </div>
        )}

        {!error && (
          <>
            <div className="memorial-zone zone-hill" id="bukit-kehormatan">
              <header className="zone-marker">
                <span className="zone-index">01</span>
                <div className="zone-copy">
                  <h3>Bukit Kehormatan</h3>
                  <p>VIP &amp; Legenda · monumen abadi di tanah tertinggi</p>
                </div>
                <span className="zone-count">{landmarks.length} monumen</span>
              </header>
              {loading ? (
                <div className="monument-field"><Skeleton className="monument-skeleton" /><Skeleton className="monument-skeleton" /></div>
              ) : landmarks.length ? (
                <div className="monument-field">
                  {landmarks.map((item, index) => (
                    <Monument key={item.id} makam={item} plotIndex={index} zone="hill" onSelect={onSelect} onFlower={onFlower} flowerStatus={flowerStatus(item.id)} flowerCountdown={flowerCountdown(item.id)} isVip={isVip(item)} erosion={erosion(item)} highlighted={highlightedId === item.id} />
                  ))}
                </div>
              ) : (
                <p className="zone-quiet"><Landmark size={15} aria-hidden="true" /> Bukit masih menunggu monumen abadi pertama.</p>
              )}
            </div>

            <div className="memorial-zone zone-valley" id="lembah-perjuangan">
              <header className="zone-marker">
                <span className="zone-index">02</span>
                <div className="zone-copy">
                  <h3>Lembah Perjuangan</h3>
                  <p>Makam umum · jejak erosi masih terlihat di batu</p>
                </div>
                <span className="zone-count">{makam.length - landmarks.length} monumen</span>
              </header>
              {loading ? (
                <div className="monument-field">
                  {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="monument-skeleton" />)}
                </div>
              ) : makam.length - landmarks.length ? (
                <div className="monument-field">
                  {makam.filter((item) => !isVip(item)).map((item, index) => (
                    <Monument key={item.id} makam={item} plotIndex={index} zone="valley" onSelect={onSelect} onFlower={onFlower} flowerStatus={flowerStatus(item.id)} flowerCountdown={flowerCountdown(item.id)} isVip={isVip(item)} erosion={erosion(item)} highlighted={highlightedId === item.id} />
                  ))}
                </div>
              ) : (
                <div className="ground-empty">
                  <EmptyState
                    icon={<ArrowUpRight size={20} aria-hidden="true" />}
                    title={hasFilter ? "Tak ada monumen di lensa ini" : "Lembah masih kosong"}
                    description={hasFilter ? "Coba lensa kategori lain atau hapus pencarian untuk melihat seluruh taman." : "Petak pertama masih menunggu sebuah mimpi untuk dikubur."}
                    actionLabel={hasFilter ? "Lihat semua monumen" : "Kuburkan Mimpi"}
                    onAction={hasFilter ? onResetFilter : onBury}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <p className="sr-only" aria-live="polite">{makam.length} monumen ditemukan</p>
    </section>
  );
}
