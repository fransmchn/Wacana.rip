import { AlertTriangle, Landmark } from "lucide-react";
import type { CSSProperties } from "react";
import type { Makam } from "@/types/graveyard";
import type { ErosionInfo } from "@/lib/utils";
import { TombstoneCard } from "@/components/TombstoneCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

interface TombstoneGridProps {
  makam: Makam[];
  loading?: boolean;
  hasFilter?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onResetFilter?: () => void;
  onSelect: (makam: Makam) => void;
  onFlower: (id: string) => void;
  onBury: () => void;
  highlightedId?: string | null;
  flowerStatus: (id: string) => "active" | "done" | "login";
  flowerCountdown: (id: string) => string | undefined;
  isVip: (makam: Makam) => boolean;
  erosion: (makam: Makam) => ErosionInfo;
}

/** Enam "petak" tetap: lebar, ketinggian, dan kedalaman berbeda di setiap baris. */
const PLOTS = [
  { col: 1, span: 4, y: 0, scale: 1 },
  { col: 6, span: 3, y: 92, scale: 0.94 },
  { col: 10, span: 3, y: 28, scale: 0.97 },
  { col: 2, span: 3, y: 40, scale: 0.95 },
  { col: 6, span: 4, y: 0, scale: 1.03 },
  { col: 10, span: 3, y: 116, scale: 0.92 },
];

function plotStyle(index: number): CSSProperties {
  const plot = PLOTS[index % PLOTS.length];
  return {
    "--plot-col": plot.col,
    "--plot-span": plot.span,
    "--plot-row": Math.floor(index / 3) + 1,
    "--plot-y": `${plot.y}px`,
    "--plot-scale": plot.scale,
    "--stagger": `${Math.min(index * 55, 550)}ms`,
  } as CSSProperties;
}

export function TombstoneGrid({ makam, loading = false, hasFilter = false, error, onRetry, onResetFilter, onSelect, onFlower, onBury, highlightedId, flowerStatus, flowerCountdown, isVip, erosion }: TombstoneGridProps) {
  if (loading) return <div className="graveyard-plots" aria-busy="true" aria-label="Memuat makam">{Array.from({ length: 6 }, (_, index) => <div key={index} className="grave-plot" style={plotStyle(index)}><div className="tombstone-skeleton"><Skeleton className="tombstone-skeleton-cap" /><Skeleton className="tombstone-skeleton-body" /></div></div>)}</div>;
  if (error) return <EmptyState icon={<AlertTriangle size={20} />} title="Pemakaman sedang berkabut" description={error} actionLabel={onRetry ? "Coba lagi" : undefined} onAction={onRetry} />;
  if (!makam.length && hasFilter) return <EmptyState title="Tidak ada makam yang cocok" description="Coba ubah kata pencarian atau kategori." actionLabel="Reset filter" onAction={onResetFilter} />;
  if (!makam.length) return <EmptyState icon={<Landmark size={20} />} title="Belum ada makam di sini" description="Wacana pertama bisa punya tempat untuk pulang." actionLabel="Kuburkan wacana pertama" onAction={onBury} />;
  return (
    <div className="graveyard-plots">
      {makam.map((item, index) => (
        <div key={item.id} className="grave-plot" style={plotStyle(index)}>
          <TombstoneCard
            makam={item}
            onSelect={onSelect}
            onFlower={onFlower}
            flowerStatus={flowerStatus(item.id)}
            flowerCountdown={flowerCountdown(item.id)}
            isVip={isVip(item)}
            erosion={erosion(item)}
            highlighted={item.id === highlightedId}
          />
        </div>
      ))}
    </div>
  );
}
