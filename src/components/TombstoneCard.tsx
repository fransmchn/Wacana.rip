import { Flower2, Flame, Heart, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { FlowerBurst } from "@/components/FlowerBurst";
import type { Makam } from "@/types/graveyard";
import { formatTanggal, getDurasiHari, getLabelDurasi, getTipeNisan } from "@/lib/utils";

const categoryLabel: Record<Makam["kategori"], string> = {
  skripsi: "Skripsi",
  koding: "Koding",
  desain: "Desain",
  bisnis: "Bisnis",
  resolusi: "Resolusi",
  hubungan: "Hubungan",
  pribadi: "Pribadi",
  pekerjaan: "Pekerjaan",
  keluarga: "Keluarga",
  kesehatan: "Kesehatan",
  perjalanan: "Perjalanan",
  lainnya: "Lainnya",
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
}

export function TombstoneCard({ makam, onSelect, onFlower, onCandle, flowerStatus, flowerCountdown, candleMine, highlighted = false }: TombstoneCardProps) {
  const tipe = getTipeNisan(makam.tanggalMulai, makam.tanggalMenyerah);
  const durasi = getDurasiHari(makam.tanggalMulai, makam.tanggalMenyerah);
  const [flowerBurst, setFlowerBurst] = useState(false);

  function handleFlower() {
    if (flowerStatus === "active") setFlowerBurst(true);
    onFlower(makam.id);
  }

  return (
    <motion.article layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }} className={`tombstone tombstone-${tipe} ${makam.lilin ? "is-lit" : ""} ${highlighted ? "tombstone-new" : ""}`} onClick={() => onSelect(makam)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect(makam); }} aria-label={`Buka detail ${makam.judul}`}>
      <FlowerBurst active={flowerBurst} onDone={() => setFlowerBurst(false)} />
      <div className="tombstone-cap" />
      <div className="relative flex min-h-[330px] flex-col px-5 pb-4 pt-8">
        <div className="mb-5 flex items-start justify-between gap-3">
          <span className="rounded-full border border-current/20 px-2.5 py-1 text-[10px] uppercase tracking-[.12em] opacity-80">{categoryLabel[makam.kategori]}</span>
          <span className="font-mono text-[10px] opacity-60">#{makam.id.slice(-4)}</span>
        </div>
        <div className="mb-5 text-center">
          <Sparkles className="mx-auto mb-3 text-current/60" size={16} aria-hidden="true" />
          <h3 className="text-lg font-semibold leading-tight tracking-[-.02em]">{makam.judul}</h3>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[.08em] opacity-60">{formatTanggal(makam.tanggalMulai)} — {formatTanggal(makam.tanggalMenyerah)}</p>
          <p className="mt-1 text-xs opacity-70">Hidup {getLabelDurasi(durasi)}</p>
        </div>
        <div className="mt-auto border-t border-current/15 pt-4">
          <p className="mb-1 text-[10px] uppercase tracking-[.12em] opacity-55">Penyebab gugur</p>
          <p className="text-sm font-medium opacity-90">{makam.penyebab}</p>
          <p className="mt-4 line-clamp-2 text-center font-serif text-sm italic opacity-75">“{makam.epitaph}”</p>
        </div>
        <div className="mt-5 flex items-center justify-between gap-2 border-t border-current/15 pt-3" onClick={(event) => event.stopPropagation()}>
          <button disabled={flowerStatus === "done"} onClick={handleFlower} className="inline-flex min-h-10 min-w-0 items-center gap-1.5 rounded-lg px-2 text-left text-xs opacity-75 transition hover:bg-black/10 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50" aria-label={flowerStatus === "login" ? "Masuk untuk menabur" : `Tabur bunga untuk ${makam.judul}`}>
            <Flower2 size={15} aria-hidden="true" /> {flowerStatus === "login" ? "Masuk untuk menabur" : flowerStatus === "done" ? `Sudah menabur · ${flowerCountdown ?? "..."}` : `Tabur bunga · ${makam.bunga}`}
          </button>
          <button onClick={() => onCandle(makam.id)} className={`inline-flex min-h-10 min-w-0 items-center gap-1.5 rounded-lg px-2 text-left text-xs transition hover:bg-black/10 ${candleMine ? "opacity-100" : "opacity-55 hover:opacity-100"}`} aria-pressed={candleMine}>
            <Flame size={15} aria-hidden="true" /> {candleMine ? "Lilin menyala" : "Nyalakan lilin"} · {makam.lilinCount ?? (makam.lilin ? 1 : 0)}
          </button>
        </div>
      </div>
      {makam.bunga > 0 && <Heart size={12} className="absolute bottom-5 right-5 opacity-30" aria-hidden="true" />}
    </motion.article>
  );
}
