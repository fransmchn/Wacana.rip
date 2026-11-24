import { DEFAULT_TEMA, isNisanTema, temaMakam } from "@/lib/themes";
import type { Makam, NisanTema } from "@/types/graveyard";

export const THEME_STORAGE_KEY = "wacana-rip:themes";

type ThemeMap = Record<string, NisanTema>;

function readThemes(): ThemeMap {
  if (typeof window === "undefined") return {};
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(THEME_STORAGE_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([id, tema]) => typeof id === "string" && isNisanTema(tema)),
    ) as ThemeMap;
  } catch {
    return {};
  }
}

function writeThemes(themes: ThemeMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themes));
  } catch {
    /* Storage penuh atau diblokir — tema tetap berlaku di sesi ini. */
  }
}

export function getThemeOverride(graveId: string): NisanTema | undefined {
  return readThemes()[graveId];
}

export function resolveTheme(makam: Pick<Makam, "id" | "tema">): NisanTema {
  return getThemeOverride(makam.id) ?? temaMakam(makam);
}

export function setThemeOverride(graveId: string, tema: NisanTema): void {
  if (!graveId || !isNisanTema(tema)) return;
  writeThemes({ ...readThemes(), [graveId]: tema });
}

export function removeThemeOverride(graveId: string): void {
  const themes = readThemes();
  delete themes[graveId];
  writeThemes(themes);
}

export function applyThemeOverrides(makam: Makam[]): Makam[] {
  const themes = readThemes();
  if (!Object.keys(themes).length) return makam;
  return makam.map((item) => (themes[item.id] ? { ...item, tema: themes[item.id] } : item));
}

/** Dipakai saat draft VIP dibayar lalu makam asli dibuat. */
export function moveThemeOverride(fromId: string, toId: string): void {
  const themes = readThemes();
  const tema = themes[fromId];
  delete themes[fromId];
  if (tema) themes[toId] = tema;
  writeThemes(themes);
}

export function defaultTheme(): NisanTema {
  return DEFAULT_TEMA;
}
