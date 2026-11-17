import { AlertTriangle, Landmark } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import type { CSSProperties } from "react";
import type { Makam } from "@/types/graveyard";
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
  onCandle: (id: string) => void;
  onBury: () => void;
  highlightedId?: string | null;
  flowerStatus: (id: string) => "active" | "done" | "login";
  flowerCountdown: (id: string) => string | undefined;
  candleMine: (id: string) => boolean;
}

export function TombstoneGrid({ makam, loading = false, hasFilter = false, error, onRetry, onResetFilter, onSelect, onFlower, onCandle, onBury, highlightedId, flowerStatus, flowerCountdown, candleMine }: TombstoneGridProps) {
  if (loading) return <div className="tombstone-grid" aria-busy="true" aria-label="Memuat makam">{Array.from({ length: 6 }, (_, index) => <div key={index} className="tombstone-skeleton"><Skeleton className="tombstone-skeleton-cap" /><Skeleton className="tombstone-skeleton-body" /></div>)}</div>;
  if (error) return <EmptyState icon={<AlertTriangle size={20} />} title="Pemakaman sedang berkabut" description={error} actionLabel={onRetry ? "Coba lagi" : undefined} onAction={onRetry} />;
  if (!makam.length && hasFilter) return <EmptyState title="Tidak ada makam yang cocok" description="Coba ubah kata pencarian atau kategori." actionLabel="Reset filter" onAction={onResetFilter} />;
  if (!makam.length) return <EmptyState icon={<Landmark size={20} />} title="Belum ada makam di sini" description="Wacana pertama bisa punya tempat untuk pulang." actionLabel="Kuburkan wacana pertama" onAction={onBury} />;
  return <div className="tombstone-grid"><AnimatePresence initial={false}>{makam.map((item, index) => <TombstoneCard key={item.id} makam={item} onSelect={onSelect} onFlower={onFlower} onCandle={onCandle} flowerStatus={flowerStatus(item.id)} flowerCountdown={flowerCountdown(item.id)} candleMine={candleMine(item.id)} highlighted={item.id === highlightedId} style={{ "--stagger": `${Math.min(index * 40, 400)}ms` } as CSSProperties} />)}</AnimatePresence></div>;
}
