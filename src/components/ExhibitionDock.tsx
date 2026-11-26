"use client";

import { Compass, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import type { Kategori } from "@/types/graveyard";

const categories: Array<{ value: "semua" | Kategori; label: string }> = [
  { value: "semua", label: "Semua" },
  { value: "skripsi", label: "Skripsi" },
  { value: "koding", label: "Koding" },
  { value: "desain", label: "Desain" },
  { value: "bisnis", label: "Bisnis" },
  { value: "resolusi", label: "Resolusi" },
  { value: "hubungan", label: "Hubungan" },
  { value: "pribadi", label: "Pribadi" },
  { value: "pekerjaan", label: "Kerja" },
  { value: "keluarga", label: "Keluarga" },
  { value: "kesehatan", label: "Sehat" },
  { value: "perjalanan", label: "Jelajah" },
  { value: "lainnya", label: "Lain" },
];

interface ExhibitionDockProps {
  category: "semua" | Kategori;
  search: string;
  count: number;
  onCategory: (value: "semua" | Kategori) => void;
  onSearch: (value: string) => void;
  onRandom: () => void;
}

/** Bottom command bar: category lenses, search reveal, and random pilgrimage. */
export function ExhibitionDock({ category, search, count, onCategory, onSearch, onRandom }: ExhibitionDockProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setSearchOpen(false); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [searchOpen]);

  return (
    <div className="hud-dock-wrap">
      {searchOpen && (
        <div className="hud-search-panel">
          <Input
            ref={inputRef}
            aria-label="Cari monumen"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") setSearchOpen(false); }}
            placeholder="Cari judul atau penyebab..."
            leading={<Search size={16} />}
            trailing={search ? <IconButton size="sm" variant="ghost" label="Hapus pencarian" onClick={() => { onSearch(""); inputRef.current?.focus(); }}><X size={15} /></IconButton> : undefined}
          />
        </div>
      )}
      <div className="hud-dock" role="toolbar" aria-label="Kontrol area pemakaman">
        <div className="chip-rail" role="group" aria-label="Filter kategori monumen">
          {categories.map((item) => (
            <Chip key={item.value} active={category === item.value} onClick={() => onCategory(item.value)}>{item.label}</Chip>
          ))}
        </div>
        <span className="hud-dock-count" aria-live="polite">{count} monumen</span>
        <Button variant="secondary" size="sm" aria-expanded={searchOpen} onClick={() => setSearchOpen((open) => !open)} aria-label="Cari monumen">
          <Search size={15} aria-hidden="true" />
          <span>Cari</span>
        </Button>
        <Button size="sm" disabled={count === 0} onClick={onRandom} aria-label="Ziarah Acak">
          <Compass size={16} aria-hidden="true" />
          <span>Ziarah Acak</span>
        </Button>
      </div>
    </div>
  );
}
