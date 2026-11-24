"use client";

import { Clock3, Flower2, Landmark, WalletCards } from "lucide-react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import type { Statistik } from "@/types/graveyard";
import { formatCompactRupiah } from "@/lib/utils";
import { Tooltip } from "@/components/ui/Tooltip";

interface StatsBannerProps { statistik: Statistik; }

/** Angka statistik diukir langsung ke lempengan batu altar, bukan kartu SaaS. */
export function StatsBanner({ statistik }: StatsBannerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reducedMotion = useReducedMotion();
  const items = [
    { label: "Wacana terkubur", value: statistik.totalMakam, full: statistik.totalMakam.toLocaleString("id-ID"), icon: Landmark, compact: false },
    { label: "Bunga ditaburkan", value: statistik.totalBunga, full: statistik.totalBunga.toLocaleString("id-ID"), icon: Flower2, compact: false },
    { label: "Kerugian tercatat", value: statistik.totalRupiah, full: new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(statistik.totalRupiah), icon: WalletCards, compact: true },
    { label: "Jam terbuang", value: statistik.totalJam, full: `${statistik.totalJam.toLocaleString("id-ID")} jam`, icon: Clock3, compact: false, suffix: " jam" },
  ];

  return (
    <div ref={ref} className="altar-plaques" role="group" aria-label="Statistik pemakaman">
      <h2 className="sr-only">Statistik TPU Wacana</h2>
      {items.map(({ label, value, full, icon: Icon, compact, suffix }) => (
        <div key={label} className="plaque">
          <span className="plaque-icon"><Icon size={14} aria-hidden="true" /></span>
          <Tooltip label={full}>
            <span className="plaque-value-wrap" tabIndex={0} aria-label={full}>
              <AnimatedNumber value={value} compact={compact} suffix={suffix} inView={inView} reducedMotion={reducedMotion} />
              <span className="sr-only">{full}</span>
            </span>
          </Tooltip>
          <p className="plaque-label">{label}</p>
        </div>
      ))}
    </div>
  );
}

function AnimatedNumber({ value, compact = false, suffix = "", inView, reducedMotion }: { value: number; compact?: boolean; suffix?: string; inView: boolean; reducedMotion: boolean | null }) {
  const count = useMotionValue(0);
  const displayed = useTransform(count, (current) => compact ? formatCompactRupiah(current) : `${Math.round(current).toLocaleString("id-ID")}${suffix}`);

  useEffect(() => {
    if (reducedMotion) {
      count.set(value);
      return;
    }
    if (!inView) return;
    const controls = animate(count, value, { duration: 1.2, ease: "easeOut" });
    return () => controls.stop();
  }, [count, inView, reducedMotion, value]);

  return <motion.span aria-hidden="true" className="plaque-value">{displayed}</motion.span>;
}
