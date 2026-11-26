"use client";

import { useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import { Check, Crown, Flower2, Hourglass, Sparkles } from "lucide-react";
import { FlowerBurst } from "@/components/FlowerBurst";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { resolveTheme } from "@/lib/themeService";
import { getTemaNisan } from "@/lib/themes";
import type { Makam } from "@/types/graveyard";
import type { ErosionInfo } from "@/lib/utils";
import { getDurasiHari, getLabelDurasi } from "@/lib/utils";

/** Six deterministic anti-grid plots repeated across the grounds. */
const PLOTS = [
  { col: 1, span: 4, y: 0, scale: 1 },
  { col: 6, span: 3, y: 86, scale: 0.94 },
  { col: 10, span: 3, y: 28, scale: 0.98 },
  { col: 2, span: 3, y: 42, scale: 0.96 },
  { col: 6, span: 4, y: 104, scale: 1.02 },
  { col: 11, span: 2, y: 12, scale: 0.9 },
];

const categoryLabel: Record<Makam["kategori"], string> = {
  skripsi: "Skripsi", koding: "Koding", desain: "Desain", bisnis: "Bisnis", resolusi: "Resolusi",
  hubungan: "Hubungan", pribadi: "Pribadi", pekerjaan: "Kerja", keluarga: "Keluarga",
  kesehatan: "Kesehatan", perjalanan: "Perjalanan", lainnya: "Lainnya",
};

interface MonumentProps {
  makam: Makam;
  plotIndex: number;
  zone: "hill" | "valley";
  onSelect: (makam: Makam) => void;
  onFlower: (id: string) => void;
  flowerStatus: "active" | "done" | "login";
  flowerCountdown?: string;
  isVip: boolean;
  erosion: ErosionInfo;
  highlighted?: boolean;
}

/** Carved monolith on soil — not a UI card. */
export function Monument({ makam, plotIndex, zone, onSelect, onFlower, flowerStatus, flowerCountdown, isVip, erosion, highlighted = false }: MonumentProps) {
  const [flowerBurst, setFlowerBurst] = useState(false);
  const tema = getTemaNisan(resolveTheme(makam));
  const durasi = getDurasiHari(makam.tanggalMulai, makam.tanggalMenyerah);
  const landmark = isVip || tema.vip;
  const years = `${makam.tanggalMulai.slice(0, 4)} — ${makam.tanggalMenyerah.slice(0, 4)}`;
  const plot = PLOTS[plotIndex % PLOTS.length];
  const style = {
    "--plot-col": plot.col,
    "--plot-span": plot.span,
    "--plot-y": `${plot.y}px`,
    "--plot-scale": plot.scale,
    "--stagger": `${(plotIndex % PLOTS.length) * 90}ms`,
  } as CSSProperties;

  function handleSelect(target: EventTarget | null) {
    if ((target as HTMLElement | null)?.closest("button, a, input, select, textarea")) return;
    onSelect(makam);
  }

  function handleClick(event: MouseEvent<HTMLElement>) { handleSelect(event.target); }
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    if ((event.target as HTMLElement).closest("button, a, input, select, textarea")) return;
    event.preventDefault();
    onSelect(makam);
  }

  function handleFlower() {
    if (flowerStatus === "active") setFlowerBurst(true);
    onFlower(makam.id);
  }

  return (
    <article
      className={`monument tombstone tombstone-theme-${tema.id} ${landmark ? "tombstone-vip monument-landmark" : ""} ${zone === "hill" ? "monument-hill" : "monument-valley"} ${highlighted ? "tombstone-new monument-highlighted" : ""}`}
      style={style}
      data-grave-id={makam.id}
      data-theme={tema.id}
      role="button"
      tabIndex={0}
      aria-label={`Inspeksi monumen ${makam.judul}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <span className="monument-soil-shadow" aria-hidden="true" />
      <span className="tombstone-ground-shadow" aria-hidden="true" />
      <span className="tombstone-light" aria-hidden="true" />
      <FlowerBurst active={flowerBurst} onDone={() => setFlowerBurst(false)} />

      <div className="monument-pedestal" aria-hidden="true">
        <span className="monument-pedestal-top" />
        <span className="monument-pedestal-mid" />
        <span className="monument-pedestal-base" />
      </div>

      <div className="monument-stone">
        <span className="tombstone-cap" aria-hidden="true" />
        {tema.id === "beton-retak" && (
          <svg className="tombstone-crack-svg" viewBox="0 0 240 320" preserveAspectRatio="none" aria-hidden="true">
            <path d="M 38 0 L 58 48 L 44 92 L 78 144 L 68 186 L 92 224" fill="none" stroke="rgba(15, 23, 42, 0.72)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 58 48 L 82 64 M 78 144 L 106 156" fill="none" stroke="rgba(15, 23, 42, 0.55)" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M 206 18 L 182 74 L 194 116 L 166 168" fill="none" stroke="rgba(226, 232, 240, 0.16)" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M 205 19 L 181 75 L 193 117 L 165 169" fill="none" stroke="rgba(15, 23, 42, 0.6)" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
        {landmark && <span className="monument-crest" aria-hidden="true"><Crown size={18} strokeWidth={1.6} /></span>}
        <div className="monument-engraving">
          <div className="tombstone-topline">
            <div className="tombstone-badges">
              <Badge className="tombstone-badge">{categoryLabel[makam.kategori]}</Badge>
              {durasi < 1 && <Badge className="tombstone-badge">Baru</Badge>}
              {landmark && <Badge tone="gold" className="tombstone-badge tombstone-badge-vip">Abadi</Badge>}
            </div>
            <span className="tombstone-id">#{makam.id.slice(-4)}</span>
          </div>
          <Sparkles className="monument-ornament" size={15} aria-hidden="true" />
          <h3 className="tombstone-title" data-truncate="true">{makam.judul}</h3>
          <p className="tombstone-life">
            <span>{years}</span>
            <span>Hidup {getLabelDurasi(durasi)}</span>
          </p>
          <span className="monument-rule" aria-hidden="true" />
        </div>
      </div>

      <span className="monument-offering" aria-label={`${makam.bunga} bunga ditaburkan`}>
        <Flower2 size={14} aria-hidden="true" />
        <span>{makam.bunga}</span>
      </span>

      <div className="monument-condition">
        {landmark ? (
          <p className="tombstone-eternal"><Crown size={12} aria-hidden="true" /> {tema.label} · abadi</p>
        ) : (
          <div className="monument-erosion">
            <span className="monument-erosion-label"><Hourglass size={11} aria-hidden="true" /> {erosion.label}</span>
            <div className="erosion-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={erosion.progress} aria-label={erosion.label}><span style={{ width: `${erosion.progress}%` }} /></div>
          </div>
        )}
      </div>

      <div className="monument-tooltip" role="tooltip">
        <span className="tombstone-label">Penyebab Gugur</span>
        <p data-truncate="true">{makam.penyebab}</p>
      </div>

      <div className="tombstone-actions tombstone-actions-single">
        <Tooltip label={flowerStatus === "done" ? `Bisa menabur lagi dalam ${flowerCountdown ?? "..."}` : flowerStatus === "login" ? "Masuk untuk menabur bunga" : "Tabur bunga"}>
          <Button size="sm" variant="secondary" disabled={flowerStatus === "done"} onClick={handleFlower} aria-label={flowerStatus === "login" ? "Masuk untuk menabur bunga" : `Tabur bunga untuk ${makam.judul}`}>
            {flowerStatus === "done" ? <Check size={14} aria-hidden="true" /> : <Flower2 size={14} aria-hidden="true" />}
            <span>{flowerStatus === "done" ? "Besok lagi" : `Tabur bunga · ${makam.bunga}`}</span>
          </Button>
        </Tooltip>
      </div>
    </article>
  );
}
