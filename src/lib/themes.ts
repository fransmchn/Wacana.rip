import { NISAN_TEMA, type Makam, type NisanTema } from "@/types/graveyard";

export interface TemaNisan {
  id: NisanTema;
  label: string;
  short: string;
  description: string;
  vip: boolean;
  swatch: string;
  canvas: {
    base: string;
    accent: string;
    ink: string;
    muted: string;
    glow: string;
  };
}

export const TEMA_NISAN: Record<NisanTema, TemaNisan> = {
  "batu-lapuk": {
    id: "batu-lapuk",
    label: "Batu Lapuk",
    short: "GRATIS",
    description: "Batu abu-abu matte lapuk dengan tekstur kasar klasik.",
    vip: false,
    swatch: "linear-gradient(150deg, #3f3f46, #323238 52%, #27272a)",
    canvas: { base: "#27272a", accent: "#a1a1aa", ink: "#e4e4e7", muted: "#a1a1aa", glow: "rgba(161 161 170 / .14)" },
  },
  "beton-retak": {
    id: "beton-retak",
    label: "Beton Retak",
    short: "GRATIS",
    description: "Beton industrial dingin dengan retakan diagonal brutalist.",
    vip: false,
    swatch: "linear-gradient(150deg, #334155, #253143 55%, #1e293b)",
    canvas: { base: "#1e293b", accent: "#94a3b8", ink: "#e2e8f0", muted: "#94a3b8", glow: "rgba(148 163 184 / .16)" },
  },
  "obsidian-emas": {
    id: "obsidian-emas",
    label: "Obsidian Emas",
    short: "VIP",
    description: "Obsidian hitam pekat, lis ganda emas metalik, dan halo mahkota.",
    vip: true,
    swatch: "linear-gradient(145deg, #18181b, #09090b 55%, #1c1507)",
    canvas: { base: "#09090b", accent: "#fbbf24", ink: "#fef3c7", muted: "#d4a85f", glow: "rgba(245 158 11 / .28)" },
  },
  "marmer-lumut": {
    id: "marmer-lumut",
    label: "Marmer Lumut Antik",
    short: "VIP",
    description: "Marmer zamrud tua berurat perak-mint dengan kilau emerald.",
    vip: true,
    swatch: "linear-gradient(145deg, #064e3b, #04382a 55%, #022c22)",
    canvas: { base: "#022c22", accent: "#6ee7b7", ink: "#ecfdf5", muted: "#a7f3d0", glow: "rgba(16 185 129 / .28)" },
  },
  "y2k-chrome": {
    id: "y2k-chrome",
    label: "Y2K Chrome / Cyber",
    short: "VIP",
    description: "Metalik liquid chrome dengan bingkai holografik cyan-violet.",
    vip: true,
    swatch: "linear-gradient(135deg, #e4e4e7 0%, #71717a 36%, #52525b 58%, #18181b 100%)",
    canvas: { base: "#18181b", accent: "#38bdf8", ink: "#f8fafc", muted: "#cbd5e1", glow: "rgba(56 189 248 / .28)" },
  },
  "crimson-velvet": {
    id: "crimson-velvet",
    label: "Crimson Velvet",
    short: "VIP",
    description: "Merah darah bangsawan berbingkai rose-gold dengan aura teatrikal.",
    vip: true,
    swatch: "linear-gradient(145deg, #7f1d1d, #5c1111 58%, #450a0a)",
    canvas: { base: "#450a0a", accent: "#fda4af", ink: "#fff1f2", muted: "#fecdd3", glow: "rgba(244 63 94 / .28)" },
  },
};

export const FREE_TEMAS: TemaNisan[] = NISAN_TEMA.map((id) => TEMA_NISAN[id]).filter((tema) => !tema.vip);
export const VIP_TEMAS: TemaNisan[] = NISAN_TEMA.map((id) => TEMA_NISAN[id]).filter((tema) => tema.vip);
export const DEFAULT_TEMA: NisanTema = "batu-lapuk";

export function isNisanTema(value: unknown): value is NisanTema {
  return typeof value === "string" && (NISAN_TEMA as readonly string[]).includes(value);
}

export function getTemaNisan(value: unknown): TemaNisan {
  return isNisanTema(value) ? TEMA_NISAN[value] : TEMA_NISAN[DEFAULT_TEMA];
}

export function isTemaVip(value: unknown): boolean {
  return getTemaNisan(value).vip;
}

/** Fallback lama tanpa tema memakai batu lapuk, bukan tema acak. */
export function temaMakam(makam: Pick<Makam, "tema">): NisanTema {
  return getTemaNisan(makam.tema).id;
}
