import { Clock3, Flower2, Landmark, WalletCards } from "lucide-react";
import type { Statistik } from "@/types/graveyard";
import { formatRupiah } from "@/lib/utils";

interface StatsBannerProps { statistik: Statistik; }

export function StatsBanner({ statistik }: StatsBannerProps) {
  const items = [
    { label: "Wacana terkubur", value: statistik.totalMakam.toLocaleString("id-ID"), icon: Landmark },
    { label: "Bunga ditaburkan", value: statistik.totalBunga.toLocaleString("id-ID"), icon: Flower2 },
    { label: "Kerugian tercatat", value: formatRupiah(statistik.totalRupiah), icon: WalletCards },
    { label: "Jam terbuang", value: `${statistik.totalJam.toLocaleString("id-ID")} jam`, icon: Clock3 },
  ];

  return (
    <section aria-label="Statistik pemakaman" className="panel grid grid-cols-2 divide-x divide-y divide-[#ffffff12] rounded-2xl sm:grid-cols-4 sm:divide-y-0">
      {items.map(({ label, value, icon: Icon }) => (
        <div key={label} className="min-w-0 px-4 py-5 sm:px-5">
          <Icon size={17} className="mb-4 text-[#d8ad69]" aria-hidden="true" />
          <p className="truncate text-lg font-semibold tracking-[-.02em] text-[#f4f1e9] sm:text-xl">{value}</p>
          <p className="mt-1 text-[11px] leading-4 text-[#a7a69f] sm:text-xs">{label}</p>
        </div>
      ))}
    </section>
  );
}
