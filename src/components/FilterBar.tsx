"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Kategori } from "@/types/graveyard";
import { Chip } from "@/components/ui/Chip";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";

export type SortKey = "terbaru" | "terlama" | "bunga" | "lilin" | "pendek";

const categories: { value: "semua" | Kategori; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "skripsi", label: "Skripsi & riset" },
  { value: "koding", label: "Koding & teknologi" },
  { value: "desain", label: "Desain & karya" },
  { value: "bisnis", label: "Bisnis & usaha" },
  { value: "resolusi", label: "Resolusi & hobi" },
  { value: "hubungan", label: "Hubungan" },
  { value: "pribadi", label: "Hal pribadi" },
  { value: "pekerjaan", label: "Pekerjaan & karier" },
  { value: "keluarga", label: "Keluarga" },
  { value: "kesehatan", label: "Kesehatan" },
  { value: "perjalanan", label: "Perjalanan" },
  { value: "lainnya", label: "Lainnya" },
];

interface FilterBarProps {
  category: "semua" | Kategori;
  search: string;
  onCategory: (value: "semua" | Kategori) => void;
  onSearch: (value: string) => void;
}

export function FilterBar({ category, search, onCategory, onSearch }: FilterBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const chipRailRef = useRef<HTMLDivElement>(null);
  const activeChipRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef({ active: false, x: 0, scroll: 0 });
  const [railState, setRailState] = useState({ left: false, right: false });

  useEffect(() => {
    const updateRail = () => {
      const rail = chipRailRef.current;
      if (!rail) return;
      setRailState({ left: rail.scrollLeft > 1, right: rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 1 });
    };
    updateRail();
    const rail = chipRailRef.current;
    rail?.addEventListener("scroll", updateRail, { passive: true });
    window.addEventListener("resize", updateRail);
    return () => { rail?.removeEventListener("scroll", updateRail); window.removeEventListener("resize", updateRail); };
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    activeChipRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "nearest", inline: "center" });
  }, [category]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key !== "/" || target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const rail = chipRailRef.current;
    if (!rail) return;
    dragRef.current = { active: true, x: event.clientX, scroll: rail.scrollLeft };
    rail.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const rail = chipRailRef.current;
    if (!rail || !dragRef.current.active) return;
    rail.scrollLeft = dragRef.current.scroll - (event.clientX - dragRef.current.x);
  }

  function stopDragging(event: React.PointerEvent<HTMLDivElement>) {
    dragRef.current.active = false;
    chipRailRef.current?.releasePointerCapture(event.pointerId);
  }

  return <div className="filter-shell">
    <div className="filter-controls">
      <div className={`chip-rail-wrap ${railState.left ? "has-left-fade" : ""} ${railState.right ? "has-right-fade" : ""}`}>
        <div ref={chipRailRef} className="chip-rail" role="group" aria-label="Filter kategori" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={stopDragging} onPointerCancel={stopDragging}>
          {categories.map((item) => <Chip key={item.value} ref={item.value === category ? activeChipRef : undefined} active={category === item.value} onClick={() => onCategory(item.value)} onFocus={(event) => { const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; event.currentTarget.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest", inline: "center" }); }}>{item.label}</Chip>)}
        </div>
      </div>
      <div className="filter-search">
        <Input ref={inputRef} aria-label="Cari judul atau penyebab" value={search} onChange={(event) => onSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") onSearch(""); }} placeholder="Cari di pemakaman..." leading={<Search size={16} />} trailing={search ? <IconButton size="sm" variant="ghost" label="Hapus pencarian" onClick={() => { onSearch(""); inputRef.current?.focus(); }}><X size={15} /></IconButton> : <span className="search-shortcut" aria-hidden="true">/</span>} />
      </div>
    </div>
  </div>;
}
