"use client";

import { Check, Flower2, Flame, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useState, type CSSProperties } from "react";
import { FlowerBurst } from "@/components/FlowerBurst";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import type { Makam } from "@/types/graveyard";
import { formatTanggal, getDurasiHari, getLabelDurasi, getTipeNisan } from "@/lib/utils";

const categoryLabel: Record<Makam["kategori"], string> = {
  skripsi: "Skripsi", koding: "Koding", desain: "Desain", bisnis: "Bisnis", resolusi: "Resolusi", hubungan: "Hubungan", pribadi: "Pribadi", pekerjaan: "Pekerjaan", keluarga: "Keluarga", kesehatan: "Kesehatan", perjalanan: "Perjalanan", lainnya: "Lainnya",
};

interface TombstoneCardProps {
  makam: Makam;
  onSelect: (makam: Makam) => void;
  onFlower: (id: string) => void;
  onCandle: (id: string) => void;
  flowerStatus: "active" | "done" | "login";
  flowerCountdown?: string;
  candleMine: boolean;
  highlighted?: boolean;
  style?: CSSProperties;
}

export function TombstoneCard({ makam, onSelect, onFlower, onCandle, flowerStatus, flowerCountdown, candleMine, highlighted = false, style }: TombstoneCardProps) {
  const tipe = getTipeNisan(makam.tanggalMulai, makam.tanggalMenyerah);
  const durasi = getDurasiHari(makam.tanggalMulai, makam.tanggalMenyerah);
  const [flowerBurst, setFlowerBurst] = useState(false);
  const reducedMotion = useReducedMotion();
  const isNew = durasi < 1;
  const candleCount = makam.lilinCount ?? (makam.lilin ? 1 : 0);

  function handleFlower() {
    if (flowerStatus === "active") setFlowerBurst(true);
    onFlower(makam.id);
  }

  return <motion.article layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.3 }} className={`tombstone tombstone-${tipe} ${makam.lilin ? "is-lit" : ""} ${highlighted ? "tombstone-new" : ""}`} style={style} onClick={(event) => { if (event.target === event.currentTarget) onSelect(makam); }} onKeyDown={(event) => { if ((event.target as HTMLElement).closest("button, a, input, select, textarea")) return; if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(makam); } }} tabIndex={0} aria-label={`Buka detail ${makam.judul}`}>
    <FlowerBurst active={flowerBurst} onDone={() => setFlowerBurst(false)} />
    <div className="tombstone-cap" aria-hidden="true" />
    <div className="tombstone-body">
      <div className="tombstone-topline">
        <div className="tombstone-badges"><Badge tone="neutral">{categoryLabel[makam.kategori]}</Badge>{isNew && <Badge tone="accent">Baru</Badge>}</div>
        <span className="tombstone-id">#{makam.id.slice(-4)}</span>
      </div>
      <Sparkles className="tombstone-ornament" size={16} aria-hidden="true" />
      <button className="tombstone-title" type="button" onClick={() => onSelect(makam)} aria-label={`Buka detail ${makam.judul}`}><span>{makam.judul}</span></button>
      <div className="tombstone-life"><p>{formatTanggal(makam.tanggalMulai)} — {formatTanggal(makam.tanggalMenyerah)}</p><p>Hidup {getLabelDurasi(durasi)}</p></div>
      <div className="tombstone-divider" />
      <div className="tombstone-copy"><p className="tombstone-label">Penyebab gugur</p><p className="tombstone-cause">{makam.penyebab}</p><p className="tombstone-epitaph">{makam.epitaph ? `“${makam.epitaph}”` : ""}</p></div>
      <div className="tombstone-actions">
        <Tooltip label={flowerStatus === "done" ? `Bisa menabur lagi dalam ${flowerCountdown ?? "..."}` : "Tabur bunga"}>
          <Button size="sm" variant="secondary" disabled={flowerStatus === "done"} onClick={handleFlower} aria-label={flowerStatus === "login" ? "Masuk untuk menabur bunga" : `Tabur bunga untuk ${makam.judul}`}><>{flowerStatus === "done" ? <Check size={15} aria-hidden="true" /> : <Flower2 size={15} aria-hidden="true" />}<span>{flowerStatus === "done" ? "Besok lagi" : `Tabur bunga · ${makam.bunga}`}</span></></Button>
        </Tooltip>
        <Tooltip label={candleMine ? "Matikan lilin" : "Nyalakan lilin"}>
          <Button size="sm" variant="ghost" onClick={() => onCandle(makam.id)} aria-pressed={candleMine}><Flame size={15} aria-hidden="true" /><span>Nyalakan lilin · {candleCount}</span></Button>
        </Tooltip>
      </div>
    </div>
  </motion.article>;
}
