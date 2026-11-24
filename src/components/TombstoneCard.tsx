"use client";

import { useState } from "react";
import { Check, Crown, Flower2, Hourglass, Sparkles } from "lucide-react";
import { FlowerBurst } from "@/components/FlowerBurst";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { resolveTheme } from "@/lib/themeService";
import { getTemaNisan } from "@/lib/themes";
import type { Makam } from "@/types/graveyard";
import type { ErosionInfo } from "@/lib/utils";
import { formatTanggal, getDurasiHari, getLabelDurasi } from "@/lib/utils";

const categoryLabel: Record<Makam["kategori"], string> = {
  skripsi: "Skripsi", koding: "Koding", desain: "Desain", bisnis: "Bisnis", resolusi: "Resolusi", hubungan: "Hubungan", pribadi: "Pribadi", pekerjaan: "Pekerjaan", keluarga: "Keluarga", kesehatan: "Kesehatan", perjalanan: "Perjalanan", lainnya: "Lainnya",
};

interface TombstoneCardProps {
  makam: Makam;
  onSelect: (makam: Makam) => void;
  onFlower: (id: string) => void;
  flowerStatus: "active" | "done" | "login";
  flowerCountdown?: string;
  isVip: boolean;
  erosion: ErosionInfo;
  highlighted?: boolean;
}

export function TombstoneCard({ makam, onSelect, onFlower, flowerStatus, flowerCountdown, isVip, erosion, highlighted = false }: TombstoneCardProps) {
  const durasi = getDurasiHari(makam.tanggalMulai, makam.tanggalMenyerah);
  const [flowerBurst, setFlowerBurst] = useState(false);
  const isNew = durasi < 1;
  const tema = getTemaNisan(resolveTheme(makam));

  function handleFlower() {
    if (flowerStatus === "active") setFlowerBurst(true);
    onFlower(makam.id);
  }

  return (
    <article
      className={`tombstone tombstone-theme-${tema.id} ${isVip ? "tombstone-vip" : ""} ${highlighted ? "tombstone-new" : ""}`}
      data-theme={tema.id}
      onClick={(event) => { if (event.target === event.currentTarget) onSelect(makam); }}
      onKeyDown={(event) => { if ((event.target as HTMLElement).closest("button, a, input, select, textarea")) return; if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(makam); } }}
      tabIndex={0}
      aria-label={`Buka detail ${makam.judul}`}
    >
      <span className="tombstone-ground-shadow" aria-hidden="true" />
      <span className="tombstone-light" aria-hidden="true" />
      <FlowerBurst active={flowerBurst} onDone={() => setFlowerBurst(false)} />
      <div className="tombstone-cap" aria-hidden="true" />
      {isVip && <div className="tombstone-emblem" aria-hidden="true"><Crown size={18} strokeWidth={1.5} /></div>}
      <div className="tombstone-body">
        <div className="tombstone-topline">
          <div className="tombstone-badges"><Badge className="tombstone-badge">{categoryLabel[makam.kategori]}</Badge>{isNew && <Badge className="tombstone-badge">Baru</Badge>}{isVip && <Badge tone="gold" className="tombstone-badge tombstone-badge-vip">Abadi</Badge>}</div>
          <span className="tombstone-id">#{makam.id.slice(-4)}</span>
        </div>
        <Sparkles className="tombstone-ornament" size={16} aria-hidden="true" />
        <button className="tombstone-title" type="button" onClick={() => onSelect(makam)} aria-label={`Buka detail ${makam.judul}`}><span data-truncate="true">{makam.judul}</span></button>
        <div className="tombstone-life"><p>{formatTanggal(makam.tanggalMulai)} — {formatTanggal(makam.tanggalMenyerah)}</p><p>Hidup {getLabelDurasi(durasi)}</p></div>
        <div className="tombstone-divider" />
        <div className="tombstone-copy"><p className="tombstone-label">Penyebab gugur</p><p className="tombstone-cause" data-truncate="true">{makam.penyebab}</p><p className="tombstone-epitaph" data-truncate="true">{makam.epitaph ? `“${makam.epitaph}”` : ""}</p></div>
        <div className="tombstone-preservation">
          {isVip ? (
            <p className="tombstone-eternal"><Crown size={13} aria-hidden="true" /> {tema.label} · abadi</p>
          ) : (
            <div className="tombstone-erosion">
              <div className="erosion-meta"><span><Hourglass size={12} aria-hidden="true" /> {erosion.label}</span><span>{erosion.progress}%</span></div>
              <div className="erosion-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={erosion.progress} aria-label={erosion.label}><span style={{ width: `${erosion.progress}%` }} /></div>
            </div>
          )}
        </div>
        <div className="tombstone-actions tombstone-actions-single">
          <Tooltip label={flowerStatus === "done" ? `Bisa menabur lagi dalam ${flowerCountdown ?? "..."}` : flowerStatus === "login" ? "Masuk untuk menabur bunga" : "Tabur bunga"}>
            <Button size="sm" variant="secondary" disabled={flowerStatus === "done"} onClick={handleFlower} aria-label={flowerStatus === "login" ? "Masuk untuk menabur bunga" : `Tabur bunga untuk ${makam.judul}`}>
              <>{flowerStatus === "done" ? <Check size={15} aria-hidden="true" /> : <Flower2 size={15} aria-hidden="true" />}<span>{flowerStatus === "done" ? "Besok lagi" : `Tabur bunga · ${makam.bunga}`}</span></>
            </Button>
          </Tooltip>
        </div>
      </div>
    </article>
  );
}
