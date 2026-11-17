import { Search, SlidersHorizontal } from "lucide-react";
import type { Kategori } from "@/types/graveyard";

export type SortKey = "terbaru" | "bunga" | "pendek";

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
  sort: SortKey;
  search: string;
  onCategory: (value: "semua" | Kategori) => void;
  onSort: (value: SortKey) => void;
  onSearch: (value: string) => void;
}

export function FilterBar({ category, sort, search, onCategory, onSort, onSearch }: FilterBarProps) {
  return (
    <div className="filter-shell space-y-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[.16em] text-[#a7a69f]">
        <SlidersHorizontal size={15} aria-hidden="true" />
        Jelajah TPU Wacana
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Filter kategori">
          {categories.map((item) => (
            <button
              key={item.value}
              role="tab"
              aria-selected={category === item.value}
              onClick={() => onCategory(item.value)}
              className={`min-h-10 shrink-0 rounded-full border px-4 text-sm transition ${category === item.value ? "border-[#d87078] bg-[#d87078] text-[#211116]" : "border-[#ffffff1a] bg-[#ffffff05] text-[#a7a69f] hover:border-[#ffffff40] hover:text-[#f4f1e9]"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block min-w-0 sm:min-w-60">
            <span className="sr-only">Cari judul atau penyebab</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6c6b67]" aria-hidden="true" />
            <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Cari di pemakaman..." className="h-10 w-full rounded-full border border-[#ffffff1a] bg-[#ffffff08] pl-9 pr-4 text-sm text-[#f4f1e9] placeholder:text-[#6c6b67] focus:border-[#d87078]" />
          </label>
          <label className="sr-only" htmlFor="sort-makam">Urutkan makam</label>
          <select id="sort-makam" value={sort} onChange={(event) => onSort(event.target.value as SortKey)} className="h-10 rounded-full border border-[#ffffff1a] bg-[#17171b] px-4 text-sm text-[#a7a69f] focus:border-[#d87078]">
            <option value="terbaru">Terbaru gugur</option>
            <option value="bunga">Paling banyak bunga</option>
            <option value="pendek">Umur terpendek</option>
          </select>
        </div>
      </div>
    </div>
  );
}
