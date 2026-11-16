import type { Makam } from "@/types/graveyard";
import { TombstoneCard } from "@/components/TombstoneCard";

interface TombstoneGridProps {
  makam: Makam[];
  onSelect: (makam: Makam) => void;
  onFlower: (id: string) => void;
  onCandle: (id: string) => void;
  onBury: () => void;
  highlightedId?: string | null;
  flowerStatus: (id: string) => "active" | "done" | "login";
  flowerCountdown: (id: string) => string | undefined;
  candleMine: (id: string) => boolean;
}

export function TombstoneGrid({ makam, onSelect, onFlower, onCandle, onBury, highlightedId, flowerStatus, flowerCountdown, candleMine }: TombstoneGridProps) {
  if (!makam.length) return <div className="panel rounded-2xl px-6 py-16 text-center"><p className="text-lg text-[#f4f1e9]">Nisan tidak ditemukan di kabut ini.</p><p className="mt-2 text-sm text-[#a7a69f]">Coba ubah filter atau kuburkan wacana baru.</p><button onClick={onBury} className="mt-6 min-h-11 rounded-full bg-[#d87078] px-5 text-sm font-semibold text-[#211116]">Kuburkan Wacana</button></div>;
  return <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{makam.map((item) => <TombstoneCard key={item.id} makam={item} onSelect={onSelect} onFlower={onFlower} onCandle={onCandle} flowerStatus={flowerStatus(item.id)} flowerCountdown={flowerCountdown(item.id)} candleMine={candleMine(item.id)} highlighted={item.id === highlightedId} />)}</div>;
}
