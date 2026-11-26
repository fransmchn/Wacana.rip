import { getTemaNisan } from "@/lib/themes";
import { formatCompactRupiah, formatKerugian, formatTanggal, getDurasiHari, getLabelDurasi } from "@/lib/utils";
import type { Makam, NisanTema } from "@/types/graveyard";

export type StoryTemplate = "struk" | "breaking" | "shrine";

export const STORY_TEMPLATES: Array<{ id: StoryTemplate; label: string; hint: string }> = [
  { id: "struk", label: "Struk Kegagalan", hint: "Receipt viral" },
  { id: "breaking", label: "Breaking News / Headline Meme", hint: "Headline meme" },
  { id: "shrine", label: "Dark Monument Shrine", hint: "Aesthetic + tema" },
];

export interface StoryRenderOptions {
  template: StoryTemplate;
  vip: boolean;
  theme: NisanTema;
}

interface Fonts { serif: string; mono: string; sans: string; }

const W = 1080;
const H = 1920;
const GOLD = "#d8ad69";

async function resolveFonts(): Promise<Fonts> {
  await document.fonts?.ready;
  const style = getComputedStyle(document.documentElement);
  return {
    serif: style.getPropertyValue("--font-playfair").trim() || "Georgia, serif",
    mono: style.getPropertyValue("--font-jetbrains-mono").trim() || "monospace",
    sans: style.getPropertyValue("--font-space-grotesk").trim() || "sans-serif",
  };
}

/** Canvas yang sama dipakai preview kecil dan export 1080×1920. */
export async function renderStoryCanvas(canvas: HTMLCanvasElement, makam: Makam, options: StoryRenderOptions, scale = 0.25): Promise<void> {
  const fonts = await resolveFonts();
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Kanvas tidak tersedia di peramban ini.");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  drawStory(ctx, makam, options, fonts);
}

export async function downloadStoryPng(makam: Makam, options: StoryRenderOptions): Promise<void> {
  const canvas = document.createElement("canvas");
  await renderStoryCanvas(canvas, makam, options, 1);
  const link = document.createElement("a");
  link.download = `gugur-story-${options.template}-${makam.id.slice(-8)}.png`;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function drawStory(ctx: CanvasRenderingContext2D, makam: Makam, options: StoryRenderOptions, fonts: Fonts): void {
  if (options.template === "struk") drawStruk(ctx, makam, options, fonts);
  else if (options.template === "breaking") drawBreaking(ctx, makam, options, fonts);
  else drawShrine(ctx, makam, options, fonts);
}

/* ------------------------------------------------------------------ */
/* 1. Struk Kegagalan                                                   */
/* ------------------------------------------------------------------ */
function drawStruk(ctx: CanvasRenderingContext2D, makam: Makam, options: StoryRenderOptions, fonts: Fonts): void {
  ctx.fillStyle = "#cfc6b5";
  ctx.fillRect(0, 0, W, H);
  zigzag(ctx, 82, "#cfc6b5", "#f7f2e7");
  ctx.fillStyle = "#f7f2e7";
  ctx.fillRect(0, 98, W, 1660);
  zigzag(ctx, 1758, "#f7f2e7", "#cfc6b5");

  ctx.strokeStyle = "rgba(36 31 28 / .18)";
  ctx.lineWidth = 2;
  roundRect(ctx, 92, 150, W - 184, 1540, 10);
  ctx.stroke();

  ctx.textAlign = "center";
  setFont(ctx, fonts.mono, 34, "600");
  ctx.fillStyle = "#2a2521";
  ctx.letterSpacing = "9px";
  ctx.fillText("GUGUR.RIP", W / 2, 250);
  ctx.letterSpacing = "0px";
  setFont(ctx, fonts.mono, 23, "500");
  ctx.fillStyle = "#6f665c";
  ctx.fillText("STRUK KEGAGALAN · TPU", W / 2, 296);
  dashed(ctx, 150, W - 150, 340, "rgba(42 37 33 / .45)");

  setFont(ctx, fonts.serif, 52, "600");
  ctx.fillStyle = "#241f1b";
  wrap(ctx, makam.judul, W - 300, 3).forEach((line, index) => ctx.fillText(line, W / 2, 450 + index * 68));
  setFont(ctx, fonts.mono, 18, "400");
  ctx.fillStyle = "#887e72";
  ctx.fillText("item yang tidak jadi", W / 2, 660);
  dashed(ctx, 150, W - 150, 710, "rgba(42 37 33 / .35)");

  const rows: Array<[string, string]> = [
    ["ITEM", fit(ctx, makam.judul, 560, fonts.sans, 30)],
    ["PENYEBAB", fit(ctx, makam.penyebab, 560, fonts.sans, 28)],
    ["TOTAL RUGI", `${formatCompactRupiah(makam.kerugianRupiah ?? 0)} / ${makam.kerugianJam ?? 0} jam`],
    ["TABUR BUNGA", `${makam.bunga} kelopak`],
    ["TANGGAL GUGUR", formatTanggal(makam.tanggalMenyerah)],
  ];
  rows.forEach(([label, value], index) => {
    const y = 800 + index * 112;
    ctx.textAlign = "left";
    setFont(ctx, fonts.mono, 17, "600");
    ctx.fillStyle = "#877d70";
    ctx.fillText(label, 165, y);
    ctx.textAlign = "right";
    setFont(ctx, fonts.sans, index === 0 ? 30 : 26, "500");
    ctx.fillStyle = "#2a2521";
    ctx.fillText(fit(ctx, value, 620), W - 165, y);
    dotted(ctx, 165, W - 165, y + 26);
  });

  dashed(ctx, 150, W - 150, 1400, "rgba(42 37 33 / .45)");
  ctx.textAlign = "center";
  setFont(ctx, fonts.mono, 19, "600");
  ctx.fillStyle = "#4c443d";
  ctx.fillText("TERIMA KASIH SUDAH PERNAH BERUSAHA", W / 2, 1460);
  drawBarcode(ctx, makam.id, 260, 1500, 560, 130);
  setFont(ctx, fonts.mono, 17, "500");
  ctx.fillStyle = "#6f665c";
  ctx.fillText(makam.id.slice(-12).toUpperCase(), W / 2, 1660);
  drawBranding(ctx, options.vip, "#5e554c", fonts);
}

/* ------------------------------------------------------------------ */
/* 2. Breaking News                                                    */
/* ------------------------------------------------------------------ */
function drawBreaking(ctx: CanvasRenderingContext2D, makam: Makam, options: StoryRenderOptions, fonts: Fonts): void {
  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 220, 20, W / 2, 220, 1000);
  glow.addColorStop(0, "rgba(190 42 48 / .32)");
  glow.addColorStop(1, "rgba(190 42 48 / 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 1000);

  ctx.fillStyle = "#b5232d";
  ctx.fillRect(0, 0, W, 150);
  ctx.textAlign = "left";
  setFont(ctx, fonts.sans, 64, "700");
  ctx.fillStyle = "#fff7f2";
  ctx.fillText("BREAKING!", 64, 106);
  setFont(ctx, fonts.mono, 20, "500");
  ctx.textAlign = "right";
  ctx.fillText("EDISI TPU · GUGUR.RIP", W - 64, 100);
  divider(ctx, 64, W - 64, 190, "rgba(255 255 255 / .16)");

  ctx.textAlign = "center";
  setFont(ctx, fonts.serif, 74, "700");
  ctx.fillStyle = "#fff3e8";
  wrap(ctx, "MIMPI RESMI GUGUR DI MEDAN JUANG", W - 130, 3).forEach((line, index) => ctx.fillText(line, W / 2, 320 + index * 88));

  ctx.fillStyle = "#171319";
  roundRect(ctx, 80, 620, W - 160, 300, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(220 80 80 / .7)";
  ctx.lineWidth = 3;
  ctx.stroke();
  setFont(ctx, fonts.serif, 52, "600");
  ctx.fillStyle = "#fff8f1";
  wrap(ctx, makam.judul, W - 260, 2).forEach((line, index) => ctx.fillText(line, W / 2, 760 + index * 68));

  ctx.fillStyle = "rgba(255 255 255 / .045)";
  roundRect(ctx, 80, 970, W - 160, 340, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(255 255 255 / .12)";
  ctx.lineWidth = 1;
  ctx.stroke();
  setFont(ctx, fonts.serif, 42, "400");
  ctx.fillStyle = "#f0c9c1";
  wrap(ctx, `“${makam.epitaph}”`, W - 280, 3).forEach((line, index) => ctx.fillText(line, W / 2, 1080 + index * 62));

  ctx.textAlign = "left";
  const facts: Array<[string, string]> = [
    ["PENYEBAB", fit(ctx, makam.penyebab, 400, fonts.sans, 24)],
    ["UMUR", getLabelDurasi(getDurasiHari(makam.tanggalMulai, makam.tanggalMenyerah))],
    ["RUGI", formatKerugian(makam)],
  ];
  facts.forEach(([label, value], index) => {
    const x = 100 + (index % 2) * 480;
    const y = 1400 + Math.floor(index / 2) * 120;
    setFont(ctx, fonts.mono, 15, "600");
    ctx.fillStyle = "#b98e8e";
    ctx.fillText(label, x, y);
    setFont(ctx, fonts.sans, 25, "500");
    ctx.fillStyle = "#f5ebe7";
    ctx.fillText(fit(ctx, value, 400), x, y + 36);
  });

  ctx.save();
  ctx.translate(790, 1500);
  ctx.rotate(-0.16);
  ctx.strokeStyle = "#e2555f";
  ctx.lineWidth = 6;
  roundRect(ctx, -150, -54, 300, 108, 8);
  ctx.stroke();
  ctx.textAlign = "center";
  setFont(ctx, fonts.sans, 42, "700");
  ctx.fillStyle = "#e2555f";
  ctx.fillText("SAH GUGUR", 0, 16);
  ctx.restore();
  drawBranding(ctx, options.vip, "#d8c8c2", fonts);
}

/* ------------------------------------------------------------------ */
/* 3. Dark Aesthetic Shrine                                            */
/* ------------------------------------------------------------------ */
function drawShrine(ctx: CanvasRenderingContext2D, makam: Makam, options: StoryRenderOptions, fonts: Fonts): void {
  const palet = getTemaNisan(options.theme).canvas;
  ctx.fillStyle = palet.base;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 420, 40, W / 2, 420, 1100);
  glow.addColorStop(0, palet.glow);
  glow.addColorStop(1, "rgba(0 0 0 / 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 1300);

  ctx.strokeStyle = palet.accent;
  ctx.globalAlpha = 0.65;
  ctx.lineWidth = 3;
  roundRect(ctx, 60, 60, W - 120, H - 120, 12);
  ctx.stroke();
  ctx.globalAlpha = 0.22;
  roundRect(ctx, 82, 82, W - 164, H - 164, 8);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.textAlign = "center";
  setFont(ctx, fonts.mono, 20, "500");
  ctx.fillStyle = palet.accent;
  ctx.letterSpacing = "8px";
  ctx.fillText("TPU · GUGUR", W / 2, 170);
  ctx.letterSpacing = "0px";

  ctx.beginPath();
  ctx.arc(W / 2, 290, 46, 0, Math.PI * 2);
  ctx.strokeStyle = palet.accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  setFont(ctx, fonts.serif, 40, "600");
  ctx.fillStyle = palet.accent;
  ctx.fillText(options.vip ? "✦" : "·", W / 2, 306);

  setFont(ctx, fonts.serif, 66, "600");
  ctx.fillStyle = palet.ink;
  wrap(ctx, makam.judul, W - 200, 3).forEach((line, index) => ctx.fillText(line, W / 2, 500 + index * 80));

  setFont(ctx, fonts.mono, 23, "500");
  ctx.fillStyle = palet.muted;
  ctx.fillText(`Dikubur oleh ${makam.pembuat}`, W / 2, 780);

  setFont(ctx, fonts.serif, 40, "400");
  ctx.fillStyle = palet.accent;
  wrap(ctx, `“${makam.epitaph}”`, W - 240, 2).forEach((line, index) => ctx.fillText(line, W / 2, 930 + index * 58));

  ctx.fillStyle = "rgba(0 0 0 / .28)";
  roundRect(ctx, 100, 1100, W - 200, 500, 14);
  ctx.fill();
  ctx.strokeStyle = palet.accent;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.globalAlpha = 1;

  const facts: Array<[string, string]> = [
    ["KATEGORI", makam.kategori],
    ["PENYEBAB", makam.penyebab],
    ["GUGUR", formatTanggal(makam.tanggalMenyerah)],
    ["KERUGIAN", formatKerugian(makam)],
    ["BUNGA", `${makam.bunga} ditaburkan`],
    ["STATUS", options.vip ? "Abadi · tidak tererosi" : "Terkubur dalam 7 hari"],
  ];
  facts.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 160 + column * 400;
    const y = 1190 + row * 140;
    ctx.textAlign = "left";
    setFont(ctx, fonts.mono, 14, "600");
    ctx.fillStyle = palet.muted;
    ctx.letterSpacing = "2px";
    ctx.fillText(label.toUpperCase(), x, y);
    ctx.letterSpacing = "0px";
    setFont(ctx, fonts.sans, 24, "500");
    ctx.fillStyle = palet.ink;
    ctx.fillText(fit(ctx, value, 350), x, y + 40);
  });

  drawBranding(ctx, options.vip, palet.muted, fonts);
}

/* ------------------------------------------------------------------ */
/* Branding + helpers                                                  */
/* ------------------------------------------------------------------ */
function drawBranding(ctx: CanvasRenderingContext2D, vip: boolean, color: string, fonts: Fonts): void {
  ctx.textAlign = "center";
  if (vip) {
    setFont(ctx, fonts.mono, 18, "500");
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = color;
    ctx.letterSpacing = "4px";
    ctx.fillText("gugur.rip", W / 2, 1824);
    ctx.letterSpacing = "0px";
    ctx.globalAlpha = 1;
    return;
  }
  setFont(ctx, fonts.mono, 20, "600");
  ctx.fillStyle = color;
  ctx.letterSpacing = "3px";
  ctx.fillText("Dibuat di GUGUR.RIP", W / 2, 1824);
  ctx.letterSpacing = "0px";
}

function drawBarcode(ctx: CanvasRenderingContext2D, seed: string, x: number, y: number, width: number, height: number): void {
  const bars = 58;
  const unit = width / bars;
  let code = 0;
  for (const char of seed) code = (code * 31 + char.charCodeAt(0)) >>> 0;
  ctx.fillStyle = "#241f1b";
  for (let index = 0; index < bars; index += 1) {
    const value = ((code >>> (index % 24)) + index * 17) % 7;
    if (value < 3) continue;
    const barWidth = value === 6 ? unit * 2 : unit;
    ctx.fillRect(x + index * unit, y, Math.min(barWidth, width - index * unit), height);
  }
}

function zigzag(ctx: CanvasRenderingContext2D, y: number, top: string, bottom: string): void {
  const teeth = 54;
  const width = W / teeth;
  ctx.fillStyle = bottom;
  for (let index = 0; index < teeth; index += 1) {
    ctx.beginPath();
    ctx.moveTo(index * width, y);
    ctx.lineTo((index + 1) * width, y);
    ctx.lineTo(index * width + width / 2, y + 16);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = top;
}

function setFont(ctx: CanvasRenderingContext2D, family: string, size: number, weight = "400"): void {
  ctx.font = `${weight} ${size}px ${family}`;
}

function divider(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, color = GOLD): void {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
}

function dashed(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, color: string): void {
  ctx.save();
  ctx.setLineDash([8, 8]);
  divider(ctx, x1, x2, y, color);
  ctx.restore();
}

function dotted(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number): void {
  ctx.save();
  ctx.setLineDash([2, 8]);
  divider(ctx, x1, x2, y, "rgba(42 37 33 / .28)");
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, family?: string, size?: number): string {
  if (family && size) setFont(ctx, family, size, "500");
  if (ctx.measureText(text).width <= maxWidth) return text;
  let value = text;
  while (value.length > 1 && ctx.measureText(`${value}…`).width > maxWidth) value = value.slice(0, -1);
  return `${value.trimEnd()}…`;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [];
  let current = "";
  for (let index = 0; index < words.length; index += 1) {
    const candidate = current ? `${current} ${words[index]}` : words[index];
    if (ctx.measureText(candidate).width <= maxWidth) { current = candidate; continue; }
    if (current) lines.push(current);
    if (lines.length === maxLines - 1) { current = words.slice(index).join(" "); break; }
    current = words[index];
  }
  if (current && lines.length < maxLines) lines.push(current);
  const result = lines.slice(0, maxLines);
  result[result.length - 1] = fit(ctx, result[result.length - 1] ?? "", maxWidth);
  return result;
}
