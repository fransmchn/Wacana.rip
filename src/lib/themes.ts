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
    description: "Abu-abu klasik, retak halus, dan lumut tipis.",
    vip: false,
    swatch: "linear-gradient(145deg, #a49a8c, #5f5852 52%, #3c3835)",
    canvas: { base: "#1b1a1a", accent: "#c9bda9", ink: "#f4efe6", muted: "#a9a29a", glow: "rgba(201 189 169 / .16)" },
  },
  "beton-retak": {
    id: "beton-retak",
    label: "Beton Retak",
    short: "GRATIS",
    description: "Slate minimalis dengan goresan beton.",
    vip: false,
    swatch: "linear-gradient(150deg, #59646a, #2e363b 55%, #1d2428)",
    canvas: { base: "#111719", accent: "#9fb4bd", ink: "#eef4f5", muted: "#9aa9ad", glow: "rgba(159 180 189 / .14)" },
  },
  "obsidian-emas": {
    id: "obsidian-emas",
    label: "Obsidian Emas",
    short: "VIP",
    description: "Hitam matte, lis emas, dan emblem mahkota.",
    vip: true,
    swatch: "linear-gradient(145deg, #2c2433, #0d0b11 55%, #19131f)",
    canvas: { base: "#0c0a10", accent: "#d8ad69", ink: "#f6e9c9", muted: "#c1ad85", glow: "rgba(216 173 105 / .24)" },
  },
  "marmer-lumut": {
    id: "marmer-lumut",
    label: "Marmer Lumut Antik",
    short: "VIP",
    description: "Granit hijau tua dengan ukiran perak.",
    vip: true,
    swatch: "linear-gradient(145deg, #1f4a3b, #102c26 55%, #071916)",
    canvas: { base: "#0a1d19", accent: "#b9d6c6", ink: "#edf7f0", muted: "#9ab5a6", glow: "rgba(150 205 170 / .2)" },
  },
  "y2k-chrome": {
    id: "y2k-chrome",
    label: "Y2K Chrome / Cyber",
    short: "VIP",
    description: "Metalik iridescent dengan batas brutalist.",
    vip: true,
    swatch: "linear-gradient(120deg, #b7c8d6, #4b5f78 28%, #cdb8da 52%, #2b3346 74%, #9fd6d0)",
    canvas: { base: "#111722", accent: "#b8d8e8", ink: "#f2f6fb", muted: "#9fb3c6", glow: "rgba(185 216 232 / .22)" },
  },
  "crimson-velvet": {
    id: "crimson-velvet",
    label: "Crimson Velvet",
    short: "VIP",
    description: "Merah darah beludru untuk penyesalan teatrikal.",
    vip: true,
    swatch: "linear-gradient(145deg, #7c1c28, #3d0c14 58%, #1c060a)",
    canvas: { base: "#21080d", accent: "#e0a0a8", ink: "#fff1f1", muted: "#d19ba1", glow: "rgba(224 160 168 / .2)" },
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
