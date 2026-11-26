import { getTemaNisan } from "@/lib/themes";
import { formatCompactRupiah, formatTanggal, getDurasiHari, getLabelDurasi } from "@/lib/utils";
import type { Makam, NisanTema } from "@/types/graveyard";

export type StoryTemplate = "struk" | "editorial" | "shrine";

export const STORY_TEMPLATES: Array<{ id: StoryTemplate; label: string; hint: string }> = [
  { id: "struk", label: "Struk Kegagalan", hint: "Receiptify thermal" },
  { id: "editorial", label: "Dark Editorial Poster", hint: "Wrapped / A24 vibe" },
  { id: "shrine", label: "3D Monument Shrine", hint: "Tactile VIP card" },
];

export interface StoryRenderOptions {
  template: StoryTemplate;
  vip: boolean;
  theme: NisanTema;
}

interface Fonts {
  serif: string;
  mono: string;
  sans: string;
}

interface ThemeVisual {
  bgTop: string;
  bgMid: string;
  bgBottom: string;
  meshA: string;
  meshB: string;
  stoneTop: string;
  stoneMid: string;
  stoneBottom: string;
  border: string;
  borderInner: string;
  accent: string;
  ink: string;
  muted: string;
  glow: string;
  pillBg: string;
}

const W = 1080;
const H = 1920;

const THEME_VISUALS: Record<NisanTema, ThemeVisual> = {
  "batu-lapuk": {
    bgTop: "#141417",
    bgMid: "#0d0d10",
    bgBottom: "#070709",
    meshA: "rgba(161, 161, 170, 0.24)",
    meshB: "rgba(82, 82, 91, 0.28)",
    stoneTop: "#44444c",
    stoneMid: "#323238",
    stoneBottom: "#242428",
    border: "#71717a",
    borderInner: "rgba(212, 212, 216, 0.25)",
    accent: "#d4d4d8",
    ink: "#f4f4f5",
    muted: "#a1a1aa",
    glow: "rgba(161, 161, 170, 0.24)",
    pillBg: "rgba(255, 255, 255, 0.08)",
  },
  "beton-retak": {
    bgTop: "#0f172a",
    bgMid: "#0b1120",
    bgBottom: "#060913",
    meshA: "rgba(148, 163, 184, 0.25)",
    meshB: "rgba(51, 65, 85, 0.34)",
    stoneTop: "#3b4c63",
    stoneMid: "#283548",
    stoneBottom: "#1b2535",
    border: "#64748b",
    borderInner: "rgba(203, 213, 225, 0.26)",
    accent: "#cbd5e1",
    ink: "#f1f5f9",
    muted: "#94a3b8",
    glow: "rgba(148, 163, 184, 0.26)",
    pillBg: "rgba(148, 163, 184, 0.14)",
  },
  "obsidian-emas": {
    bgTop: "#13100a",
    bgMid: "#09090b",
    bgBottom: "#050507",
    meshA: "rgba(245, 158, 11, 0.34)",
    meshB: "rgba(180, 83, 9, 0.22)",
    stoneTop: "#1a181e",
    stoneMid: "#0c0c0f",
    stoneBottom: "#070709",
    border: "#f59e0b",
    borderInner: "#fbbf24",
    accent: "#fbbf24",
    ink: "#fef3c7",
    muted: "#e2be76",
    glow: "rgba(245, 158, 11, 0.36)",
    pillBg: "rgba(245, 158, 11, 0.14)",
  },
  "marmer-lumut": {
    bgTop: "#04261d",
    bgMid: "#021812",
    bgBottom: "#010d0a",
    meshA: "rgba(16, 185, 129, 0.34)",
    meshB: "rgba(5, 150, 105, 0.24)",
    stoneTop: "#0b5c46",
    stoneMid: "#053d2e",
    stoneBottom: "#02261d",
    border: "#34d399",
    borderInner: "rgba(167, 243, 208, 0.45)",
    accent: "#6ee7b7",
    ink: "#ecfdf5",
    muted: "#a7f3d0",
    glow: "rgba(16, 185, 129, 0.36)",
    pillBg: "rgba(16, 185, 129, 0.15)",
  },
  "y2k-chrome": {
    bgTop: "#111827",
    bgMid: "#0d0f18",
    bgBottom: "#07080d",
    meshA: "rgba(56, 189, 248, 0.34)",
    meshB: "rgba(168, 85, 247, 0.32)",
    stoneTop: "#d4d4d8",
    stoneMid: "#52525b",
    stoneBottom: "#18181b",
    border: "#38bdf8",
    borderInner: "#a855f7",
    accent: "#38bdf8",
    ink: "#ffffff",
    muted: "#e0f2fe",
    glow: "rgba(56, 189, 248, 0.38)",
    pillBg: "rgba(56, 189, 248, 0.16)",
  },
  "crimson-velvet": {
    bgTop: "#2b090e",
    bgMid: "#180508",
    bgBottom: "#0c0204",
    meshA: "rgba(225, 29, 72, 0.36)",
    meshB: "rgba(127, 29, 29, 0.34)",
    stoneTop: "#8b1d24",
    stoneMid: "#5e1116",
    stoneBottom: "#3a080c",
    border: "#fda4af",
    borderInner: "rgba(254, 205, 211, 0.45)",
    accent: "#fda4af",
    ink: "#fff1f2",
    muted: "#fecdd3",
    glow: "rgba(225, 29, 72, 0.38)",
    pillBg: "rgba(253, 164, 175, 0.14)",
  },
};

async function resolveFonts(): Promise<Fonts> {
  await document.fonts?.ready;
  const style = getComputedStyle(document.documentElement);
  return {
    serif: style.getPropertyValue("--font-playfair").trim() || "Georgia, serif",
    mono: style.getPropertyValue("--font-jetbrains-mono").trim() || "monospace",
    sans: style.getPropertyValue("--font-space-grotesk").trim() || "sans-serif",
  };
}

/** Canvas yang sama dipakai preview retina (scale 0.5) dan export 1080×1920 (scale 1). */
export async function renderStoryCanvas(
  canvas: HTMLCanvasElement,
  makam: Makam,
  options: StoryRenderOptions,
  scale = 0.5,
): Promise<void> {
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
  link.download = `graveyard-story-${options.template}-${makam.id.slice(-8)}.png`;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function drawStory(ctx: CanvasRenderingContext2D, makam: Makam, options: StoryRenderOptions, fonts: Fonts): void {
  if (options.template === "struk") drawReceipt(ctx, makam, options, fonts);
  else if (options.template === "editorial") drawEditorial(ctx, makam, options, fonts);
  else drawShrine(ctx, makam, options, fonts);
}

/* ================================================================== */
/* 1. Receiptify / Struk Kegagalan (Viral Thermal Receipt Design)      */
/* ================================================================== */
function drawReceipt(ctx: CanvasRenderingContext2D, makam: Makam, options: StoryRenderOptions, fonts: Fonts): void {
  // Full-bleed dark grainy background (#0C0C0E)
  ctx.fillStyle = "#0C0C0E";
  ctx.fillRect(0, 0, W, H);

  const bgGlow = ctx.createRadialGradient(W / 2, H * 0.42, 60, W / 2, H * 0.42, 820);
  bgGlow.addColorStop(0, "rgba(245, 158, 11, 0.12)");
  bgGlow.addColorStop(0.55, "rgba(255, 255, 255, 0.03)");
  bgGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, W, H);

  drawFilmGrain(ctx, 1800, 0.055);

  // Floating, gently tilted thermal receipt paper
  const pw = 840;
  const ph = 1520;
  const px = -pw / 2;
  const py = -ph / 2;
  const tooth = 24;
  const toothH = 15;

  ctx.save();
  ctx.translate(W / 2, H / 2 - 16);
  ctx.rotate(-0.022);

  // Realistic deep paper drop shadow
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.78)";
  ctx.shadowBlur = 72;
  ctx.shadowOffsetX = 14;
  ctx.shadowOffsetY = 34;
  traceSerratedPaper(ctx, px, py, pw, ph, tooth, toothH);
  ctx.fillStyle = "#F4F1EA";
  ctx.fill();
  ctx.restore();

  // Clip inside serrated receipt for creases & paper texture
  ctx.save();
  traceSerratedPaper(ctx, px, py, pw, ph, tooth, toothH);
  ctx.clip();

  // Subtle warm cream thermal gradient
  const paperGrad = ctx.createLinearGradient(px, py, px + pw, py + ph);
  paperGrad.addColorStop(0, "#F7F4EE");
  paperGrad.addColorStop(0.45, "#F2EFE7");
  paperGrad.addColorStop(0.52, "#EAE5DA");
  paperGrad.addColorStop(1, "#F5F2EB");
  ctx.fillStyle = paperGrad;
  ctx.fillRect(px, py, pw, ph);

  // Realistic horizontal fold crease across middle
  const crease = ctx.createLinearGradient(0, -140, 0, -90);
  crease.addColorStop(0, "rgba(0, 0, 0, 0)");
  crease.addColorStop(0.48, "rgba(28, 25, 23, 0.06)");
  crease.addColorStop(0.54, "rgba(255, 255, 255, 0.45)");
  crease.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = crease;
  ctx.fillRect(px, -140, pw, 50);

  // Second subtle lower crease
  const crease2 = ctx.createLinearGradient(0, 290, 0, 330);
  crease2.addColorStop(0, "rgba(0, 0, 0, 0)");
  crease2.addColorStop(0.5, "rgba(28, 25, 23, 0.045)");
  crease2.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = crease2;
  ctx.fillRect(px, 290, pw, 40);

  const left = px + 62;
  const right = px + pw - 62;
  const innerW = right - left;
  const ink = "#1C1917";
  const inkSoft = "#57534E";

  // Header
  ctx.textAlign = "center";
  setFont(ctx, fonts.mono, 32, "700");
  ctx.fillStyle = ink;
  ctx.fillText("*** GRAVEYARD RECEIPT ***", 0, py + 96);

  setFont(ctx, fonts.mono, 21, "500");
  ctx.fillStyle = inkSoft;
  ctx.fillText(`ORDER #${makam.id.slice(-8).toUpperCase()}  •  ${formatTanggal(makam.tanggalMenyerah).toUpperCase()}`, 0, py + 140);

  setFont(ctx, fonts.mono, 20, "500");
  ctx.fillText(`PEZIARAH: ${fit(ctx, makam.pembuat.toUpperCase(), 540)}`, 0, py + 174);

  dashed(ctx, left, right, py + 208, "rgba(28, 25, 23, 0.45)", 2.5);
  dashed(ctx, left, right, py + 216, "rgba(28, 25, 23, 0.22)", 1.5);

  // Featured Fallen Dream Title
  setFont(ctx, fonts.serif, 48, "700");
  ctx.fillStyle = ink;
  const titleLines = wrap(ctx, makam.judul, innerW - 24, 2);
  titleLines.forEach((line, idx) => {
    ctx.fillText(line, 0, py + 290 + idx * 58);
  });

  const afterTitleY = py + 290 + titleLines.length * 58 + 8;
  setFont(ctx, fonts.mono, 20, "600");
  ctx.fillStyle = inkSoft;
  ctx.fillText(`KATEGORI: ${makam.kategori.toUpperCase()}  •  ${options.vip ? "ABADI VIP" : "MAKAM UMUM"}`, 0, afterTitleY);

  dashed(ctx, left, right, afterTitleY + 34, "rgba(28, 25, 23, 0.4)", 2);

  // Itemized Breakdown Table with Dotted Leaders
  const durasi = getDurasiHari(makam.tanggalMulai, makam.tanggalMenyerah);
  const timeWasted = makam.kerugianJam
    ? `${makam.kerugianJam} JAM (${getLabelDurasi(durasi)})`
    : getLabelDurasi(durasi).toUpperCase();
  const financialLoss = makam.kerugianRupiah
    ? formatCompactRupiah(makam.kerugianRupiah)
    : "RP 0 (MENTAL SAJA)";

  const items: Array<{ label: string; value: string }> = [
    { label: "ITEM", value: makam.judul },
    { label: "CAUSE OF DEATH", value: makam.penyebab },
    { label: "TIME WASTED", value: timeWasted },
    { label: "FINANCIAL LOSS", value: financialLoss },
    { label: "FLOWERS", value: `${makam.bunga} KELOPAK` },
  ];

  let cursorY = afterTitleY + 92;
  items.forEach((row) => {
    // Label on left
    ctx.textAlign = "left";
    setFont(ctx, fonts.mono, 21, "700");
    ctx.fillStyle = inkSoft;
    ctx.fillText(row.label, left, cursorY);
    const labelW = ctx.measureText(row.label).width;

    // Value on right (fitted cleanly)
    ctx.textAlign = "right";
    setFont(ctx, fonts.mono, 24, "600");
    ctx.fillStyle = ink;
    const maxValW = Math.min(440, innerW - labelW - 44);
    const valText = fit(ctx, row.value, maxValW);
    const valW = ctx.measureText(valText).width;
    ctx.fillText(valText, right, cursorY);

    // Dotted leader between label & value
    const dotStart = left + labelW + 14;
    const dotEnd = right - valW - 14;
    if (dotEnd > dotStart + 10) {
      dotted(ctx, dotStart, dotEnd, cursorY - 4, "rgba(28, 25, 23, 0.35)", 2);
    }
    cursorY += 76;
  });

  dashed(ctx, left, right, cursorY - 12, "rgba(28, 25, 23, 0.45)", 2);

  // Total Damage Row
  cursorY += 42;
  ctx.textAlign = "left";
  setFont(ctx, fonts.mono, 28, "700");
  ctx.fillStyle = ink;
  ctx.fillText("TOTAL DAMAGE", left, cursorY);
  ctx.textAlign = "right";
  ctx.fillText(financialLoss, right, cursorY);

  // Epitaph Quote
  cursorY += 68;
  ctx.textAlign = "center";
  setFont(ctx, fonts.serif, 32, "italic 500");
  ctx.fillStyle = "#3F3A36";
  const epitaphLines = wrap(ctx, `“${makam.epitaph}”`, innerW - 40, 2);
  epitaphLines.forEach((line, idx) => {
    ctx.fillText(line, 0, cursorY + idx * 44);
  });

  // Tilted Ink Stamp: "NO REFUNDS • REST IN PEACE"
  const stampY = py + ph - 340;
  ctx.save();
  ctx.translate(0, stampY);
  ctx.rotate(-0.045);
  ctx.strokeStyle = "#991B1B";
  ctx.lineWidth = 4;
  roundRect(ctx, -285, -36, 570, 72, 8);
  ctx.stroke();
  ctx.strokeStyle = "rgba(153, 27, 27, 0.35)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, -277, -28, 554, 56, 5);
  ctx.stroke();
  setFont(ctx, fonts.mono, 25, "700");
  ctx.fillStyle = "#991B1B";
  ctx.fillText("NO REFUNDS • REST IN PEACE", 0, 9);
  ctx.restore();

  // Multi-bar Barcode
  const barcodeY = py + ph - 246;
  drawBarcode(ctx, `${makam.id}-${makam.judul}`, -270, barcodeY, 540, 118, "#18181B");

  setFont(ctx, fonts.mono, 21, "600");
  ctx.fillStyle = inkSoft;
  ctx.fillText(`* ${makam.id.slice(-12).toUpperCase()} *`, 0, barcodeY + 150);

  setFont(ctx, fonts.mono, 18, "500");
  ctx.fillStyle = "#78716C";
  ctx.fillText("GRAVEYARD.RIP — DIGITAL MEMORIAL", 0, py + ph - 48);

  ctx.restore(); // end clip
  ctx.restore(); // end paper transform

  // Subtle bottom safe-zone branding on dark backdrop
  drawStoryFooter(ctx, options.vip, "rgba(244, 241, 234, 0.72)", fonts);
}

/* ================================================================== */
/* 2. Dark Editorial Poster (Spotify Wrapped / A24 Vibe)               */
/* ================================================================== */
function drawEditorial(ctx: CanvasRenderingContext2D, makam: Makam, options: StoryRenderOptions, fonts: Fonts): void {
  const v = THEME_VISUALS[options.theme];
  const tema = getTemaNisan(options.theme);
  const durasi = getDurasiHari(makam.tanggalMulai, makam.tanggalMenyerah);

  // Deep base vertical gradient
  const baseGrad = ctx.createLinearGradient(0, 0, 0, H);
  baseGrad.addColorStop(0, v.bgTop);
  baseGrad.addColorStop(0.55, v.bgMid);
  baseGrad.addColorStop(1, v.bgBottom);
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, W, H);

  // Rich radial mesh gradients matching the monument theme
  const mesh1 = ctx.createRadialGradient(W * 0.16, H * 0.18, 40, W * 0.16, H * 0.18, 760);
  mesh1.addColorStop(0, v.meshA);
  mesh1.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = mesh1;
  ctx.fillRect(0, 0, W, H);

  const mesh2 = ctx.createRadialGradient(W * 0.86, H * 0.68, 40, W * 0.86, H * 0.68, 760);
  mesh2.addColorStop(0, v.meshB);
  mesh2.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = mesh2;
  ctx.fillRect(0, 0, W, H);

  const mesh3 = ctx.createRadialGradient(W * 0.5, H * 0.42, 30, W * 0.5, H * 0.42, 620);
  mesh3.addColorStop(0, v.glow);
  mesh3.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = mesh3;
  ctx.fillRect(0, 0, W, H);

  drawFilmGrain(ctx, 2200, 0.045);

  // Subtle A24 editorial framing border (clears bottom footer cleanly)
  ctx.strokeStyle = v.borderInner;
  ctx.lineWidth = 2;
  roundRect(ctx, 56, 124, W - 112, H - 300, 28);
  ctx.stroke();

  // Giant expressive Playfair "R.I.P." background watermark
  ctx.save();
  ctx.textAlign = "center";
  setFont(ctx, fonts.serif, 330, "700");
  ctx.fillStyle = v.accent;
  ctx.globalAlpha = 0.075;
  ctx.fillText("R.I.P.", W / 2, 540);
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = v.accent;
  ctx.lineWidth = 2;
  ctx.strokeText("R.I.P.", W / 2, 540);
  ctx.restore();

  // Top editorial metadata bar (inside safe zone)
  ctx.textAlign = "center";
  setFont(ctx, fonts.mono, 22, "600");
  ctx.fillStyle = v.accent;
  ctx.fillText(`✦  GRAVEYARD ARCHIVE  •  ${tema.label.toUpperCase()}  ✦`, W / 2, 206);

  // Category & VIP pill
  const topPillText = options.vip
    ? `${makam.kategori.toUpperCase()}  •  MONUMEN ABADI VIP`
    : `${makam.kategori.toUpperCase()}  •  ARSIP MIMPI GUGUR`;
  drawGlassPill(ctx, W / 2, 276, topPillText, v.pillBg, v.border, v.ink, fonts.mono, 21);

  // Giant Hero Title (Playfair Display)
  ctx.textAlign = "center";
  ctx.save();
  ctx.shadowColor = v.glow;
  ctx.shadowBlur = 32;
  setFont(ctx, fonts.serif, 76, "700");
  ctx.fillStyle = v.ink;
  const heroLines = wrap(ctx, makam.judul, W - 190, 3);
  const heroStartY = heroLines.length === 1 ? 520 : heroLines.length === 2 ? 485 : 450;
  heroLines.forEach((line, idx) => {
    ctx.fillText(line, W / 2, heroStartY + idx * 94);
  });
  ctx.restore();

  const afterHeroY = heroStartY + heroLines.length * 94 + 20;
  setFont(ctx, fonts.mono, 24, "500");
  ctx.fillStyle = v.muted;
  ctx.fillText(
    `${formatTanggal(makam.tanggalMulai).toUpperCase()}  —  ${formatTanggal(makam.tanggalMenyerah).toUpperCase()}`,
    W / 2,
    afterHeroY,
  );

  // Glassmorphic Stat Badges (RUGI, UMUR, BUNGA)
  const lossLabel = makam.kerugianRupiah ? formatCompactRupiah(makam.kerugianRupiah) : "Rp 0";
  const statsY = afterHeroY + 104;
  drawGlassPill(ctx, W / 2, statsY, `RUGI: ${lossLabel}`, v.pillBg, v.border, v.ink, fonts.mono, 27, 28, 20);
  drawGlassPill(ctx, W / 2 - 205, statsY + 98, `UMUR: ${getLabelDurasi(durasi).toUpperCase()}`, v.pillBg, v.borderInner, v.ink, fonts.mono, 24, 24, 18);
  drawGlassPill(ctx, W / 2 + 215, statsY + 98, `BUNGA: ${makam.bunga} ✿`, v.pillBg, v.borderInner, v.ink, fonts.mono, 24, 24, 18);

  // Dramatic Quote Block with Oversized Quotation Marks
  const quoteBoxY = Math.max(statsY + 185, 1085);
  const quoteBoxH = 420;
  ctx.save();
  ctx.fillStyle = "rgba(9, 9, 11, 0.42)";
  roundRect(ctx, 106, quoteBoxY, W - 212, quoteBoxH, 24);
  ctx.fill();
  ctx.strokeStyle = v.borderInner;
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.restore();

  // Oversized opening quotation mark
  ctx.textAlign = "left";
  setFont(ctx, fonts.serif, 160, "700");
  ctx.fillStyle = v.accent;
  ctx.globalAlpha = 0.34;
  ctx.fillText("“", 136, quoteBoxY + 132);
  ctx.globalAlpha = 1;

  // Epitaph text
  ctx.textAlign = "center";
  setFont(ctx, fonts.serif, 44, "italic 500");
  ctx.fillStyle = v.ink;
  const epLines = wrap(ctx, makam.epitaph, W - 300, 3);
  const epStartY = quoteBoxY + (epLines.length === 1 ? 190 : epLines.length === 2 ? 165 : 140);
  epLines.forEach((line, idx) => {
    ctx.fillText(line, W / 2, epStartY + idx * 60);
  });

  // Cause of Death inside bottom of quote block
  divider(ctx, 210, W - 210, quoteBoxY + quoteBoxH - 102, v.borderInner, 1.5);
  setFont(ctx, fonts.mono, 18, "600");
  ctx.fillStyle = v.accent;
  ctx.fillText("PENYEBAB GUGUR", W / 2, quoteBoxY + quoteBoxH - 64);
  setFont(ctx, fonts.sans, 28, "500");
  ctx.fillStyle = v.muted;
  ctx.fillText(fit(ctx, makam.penyebab, W - 290), W / 2, quoteBoxY + quoteBoxH - 26);

  // Clean Bottom Signature Bar
  const sigY = 1664;
  divider(ctx, 120, W - 120, sigY - 46, v.borderInner, 1.5);
  ctx.textAlign = "center";
  setFont(ctx, fonts.mono, 24, "600");
  ctx.fillStyle = v.ink;
  ctx.fillText(`BURIED BY ${fit(ctx, makam.pembuat.toUpperCase(), 480)}  •  GRAVEYARD`, W / 2, sigY);

  drawStoryFooter(ctx, options.vip, v.muted, fonts);
}

/* ================================================================== */
/* 3. 3D Monument Shrine Card (Tactile Tombstone Showcase)             */
/* ================================================================== */
function drawShrine(ctx: CanvasRenderingContext2D, makam: Makam, options: StoryRenderOptions, fonts: Fonts): void {
  const v = THEME_VISUALS[options.theme];
  const tema = getTemaNisan(options.theme);
  const durasi = getDurasiHari(makam.tanggalMulai, makam.tanggalMenyerah);

  // Atmospheric moonlit graveyard background
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, v.bgTop);
  sky.addColorStop(0.55, v.bgMid);
  sky.addColorStop(1, "#050507");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  drawFilmGrain(ctx, 1800, 0.04);

  // Glowing full moon & lunar halo behind monument apex
  const moonY = 470;
  const halo = ctx.createRadialGradient(W / 2, moonY, 60, W / 2, moonY, 540);
  halo.addColorStop(0, v.glow);
  halo.addColorStop(0.5, "rgba(255, 255, 255, 0.04)");
  halo.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, 1150);

  // Concentric lunar rings
  ctx.save();
  ctx.strokeStyle = v.accent;
  ctx.globalAlpha = 0.14;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(W / 2, moonY, 270, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.08;
  ctx.beginPath();
  ctx.arc(W / 2, moonY, 370, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Top Header
  ctx.textAlign = "center";
  setFont(ctx, fonts.mono, 23, "600");
  ctx.fillStyle = v.accent;
  ctx.fillText("✦  GRAVEYARD MONUMENT SHRINE  ✦", W / 2, 188);
  setFont(ctx, fonts.mono, 19, "500");
  ctx.fillStyle = v.muted;
  ctx.fillText(options.vip ? `BUKIT KEHORMATAN  •  ${tema.label.toUpperCase()}` : `LEMBAH PERJUANGAN  •  ${tema.label.toUpperCase()}`, W / 2, 226);

  // Ground shadow & mist beneath pedestal
  const mist = ctx.createRadialGradient(W / 2, 1500, 40, W / 2, 1500, 560);
  mist.addColorStop(0, v.glow);
  mist.addColorStop(0.6, "rgba(148, 163, 184, 0.07)");
  mist.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = mist;
  ctx.fillRect(0, 1200, W, 560);

  // 3-Tier Stepped Stone Pedestal
  const pedY = 1360;
  drawPedestalTier(ctx, W / 2 - 330, pedY, 660, 34, v.stoneTop, v.stoneMid, v.borderInner);
  drawPedestalTier(ctx, W / 2 - 390, pedY + 34, 780, 42, v.stoneMid, v.stoneBottom, v.border);
  drawPedestalTier(ctx, W / 2 - 445, pedY + 76, 890, 46, v.stoneBottom, "#09090b", "rgba(255,255,255,0.08)");

  // Centered 3D Sculpted Monument Stone
  const sw = 680;
  const sh = 1040;
  const sx = (W - sw) / 2;
  const sy = 330;

  ctx.save();
  // Moonlight ambient rim shadow
  ctx.shadowColor = v.glow;
  ctx.shadowBlur = options.vip ? 70 : 42;
  ctx.shadowOffsetY = 18;
  traceMonumentShape(ctx, sx, sy, sw, sh, options.theme);

  const stoneGrad = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh);
  stoneGrad.addColorStop(0, v.stoneTop);
  stoneGrad.addColorStop(0.46, v.stoneMid);
  stoneGrad.addColorStop(1, v.stoneBottom);
  ctx.fillStyle = stoneGrad;
  ctx.fill();
  ctx.restore();

  // Clip inside stone for surface textures & rim highlights
  ctx.save();
  traceMonumentShape(ctx, sx, sy, sw, sh, options.theme);
  ctx.clip();

  // Moonlight top rim sheen
  const rimGrad = ctx.createLinearGradient(sx, sy, sx, sy + 280);
  rimGrad.addColorStop(0, "rgba(255, 255, 255, 0.18)");
  rimGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = rimGrad;
  ctx.fillRect(sx, sy, sw, 280);

  // Theme-specific tactile details
  if (options.theme === "beton-retak") {
    ctx.strokeStyle = "rgba(15, 23, 42, 0.72)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sx + 95, sy + 10);
    ctx.lineTo(sx + 145, sy + 140);
    ctx.lineTo(sx + 115, sy + 260);
    ctx.lineTo(sx + 185, sy + 410);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + sw - 85, sy + 60);
    ctx.lineTo(sx + sw - 145, sy + 210);
    ctx.lineTo(sx + sw - 120, sy + 330);
    ctx.stroke();
  } else if (options.theme === "marmer-lumut") {
    ctx.strokeStyle = "rgba(167, 243, 208, 0.2)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx + 40, sy + 240);
    ctx.bezierCurveTo(sx + 220, sy + 300, sx + 420, sy + 180, sx + sw - 20, sy + 420);
    ctx.stroke();
    ctx.strokeStyle = "rgba(226, 232, 240, 0.14)";
    ctx.beginPath();
    ctx.moveTo(sx + 90, sy + 720);
    ctx.bezierCurveTo(sx + 280, sy + 620, sx + 460, sy + 780, sx + sw - 30, sy + 640);
    ctx.stroke();
  } else if (options.theme === "y2k-chrome") {
    // Dark translucent engraving plate so text stays ultra-legible on bright chrome
    ctx.fillStyle = "rgba(9, 9, 11, 0.54)";
    roundRect(ctx, sx + 48, sy + 145, sw - 96, sh - 220, 18);
    ctx.fill();
  }
  ctx.restore();

  // Crisp outer border & VIP double inner frame
  traceMonumentShape(ctx, sx, sy, sw, sh, options.theme);
  ctx.strokeStyle = v.border;
  ctx.lineWidth = options.vip ? 5 : 3;
  ctx.stroke();

  if (options.vip) {
    traceMonumentShape(ctx, sx + 18, sy + 18, sw - 36, sh - 36, options.theme);
    ctx.strokeStyle = v.borderInner;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Apex Emblem (Crown / Star Medallion)
  const emblemY = sy + 92;
  ctx.save();
  ctx.beginPath();
  ctx.arc(W / 2, emblemY, 44, 0, Math.PI * 2);
  ctx.fillStyle = "#09090B";
  ctx.fill();
  ctx.strokeStyle = v.accent;
  ctx.lineWidth = 3;
  ctx.stroke();
  setFont(ctx, fonts.serif, 40, "700");
  ctx.fillStyle = v.accent;
  ctx.textAlign = "center";
  ctx.fillText(options.vip ? "♛" : "✦", W / 2, emblemY + 14);
  ctx.restore();

  // Engraved Typography on Monument Face
  ctx.textAlign = "center";
  setFont(ctx, fonts.serif, 44, "700");
  ctx.fillStyle = v.accent;
  ctx.fillText("R . I . P", W / 2, sy + 206);

  divider(ctx, W / 2 - 140, W / 2 + 140, sy + 234, v.accent, 2);

  // Monument Title
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
  ctx.shadowBlur = 12;
  setFont(ctx, fonts.serif, 54, "700");
  ctx.fillStyle = v.ink;
  const monLines = wrap(ctx, makam.judul, sw - 128, 3);
  const monTitleY = sy + 324;
  monLines.forEach((line, idx) => {
    ctx.fillText(line, W / 2, monTitleY + idx * 68);
  });
  ctx.restore();

  const yearsY = monTitleY + monLines.length * 68 + 16;
  setFont(ctx, fonts.mono, 24, "600");
  ctx.fillStyle = v.muted;
  ctx.fillText(
    `${makam.tanggalMulai.slice(0, 4)} — ${makam.tanggalMenyerah.slice(0, 4)}  •  HIDUP ${getLabelDurasi(durasi).toUpperCase()}`,
    W / 2,
    yearsY,
  );

  // Epitaph
  const epY = yearsY + 84;
  setFont(ctx, fonts.serif, 36, "italic 500");
  ctx.fillStyle = v.ink;
  const shrineEpLines = wrap(ctx, `“${makam.epitaph}”`, sw - 140, 2);
  shrineEpLines.forEach((line, idx) => {
    ctx.fillText(line, W / 2, epY + idx * 50);
  });

  // Cause & Loss engraved strip at bottom of stone
  const metaBoxY = sy + sh - 220;
  divider(ctx, sx + 74, sx + sw - 74, metaBoxY - 24, v.borderInner, 1.5);
  setFont(ctx, fonts.mono, 18, "600");
  ctx.fillStyle = v.accent;
  ctx.fillText("PENYEBAB GUGUR", W / 2, metaBoxY + 10);
  setFont(ctx, fonts.sans, 26, "500");
  ctx.fillStyle = v.ink;
  ctx.fillText(fit(ctx, makam.penyebab, sw - 140), W / 2, metaBoxY + 48);

  const lossText = makam.kerugianRupiah ? formatCompactRupiah(makam.kerugianRupiah) : "Rp 0";
  setFont(ctx, fonts.mono, 21, "600");
  ctx.fillStyle = v.muted;
  ctx.fillText(`RUGI ${lossText}  •  ${makam.bunga} BUNGA DITABUR`, W / 2, metaBoxY + 102);

  // Floating Golden Petals & Fireflies
  drawFloatingPetals(ctx, options.theme);

  // Tilted Certified / VIP Seal Stamp overlapping bottom-right of monolith
  ctx.save();
  ctx.translate(sx + sw - 92, sy + sh - 74);
  ctx.rotate(-0.18);
  const stampColor = options.vip ? "#FBBF24" : "#F87171";
  const stampBg = options.vip ? "rgba(24, 18, 6, 0.92)" : "rgba(38, 10, 12, 0.92)";
  const stampLabel = options.vip ? "★ ABADI VIP ★" : "CERTIFIED GUGUR";
  ctx.fillStyle = stampBg;
  roundRect(ctx, -182, -42, 364, 84, 12);
  ctx.fill();
  ctx.strokeStyle = stampColor;
  ctx.lineWidth = 4.5;
  ctx.stroke();
  ctx.strokeStyle = stampColor;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 1.5;
  roundRect(ctx, -172, -32, 344, 64, 8);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";
  setFont(ctx, fonts.mono, 26, "700");
  ctx.fillStyle = stampColor;
  ctx.fillText(stampLabel, 0, 10);
  ctx.restore();

  // Bottom Shrine Signature
  ctx.textAlign = "center";
  setFont(ctx, fonts.mono, 24, "600");
  ctx.fillStyle = v.ink;
  ctx.fillText(`DIKUBUR OLEH ${fit(ctx, makam.pembuat.toUpperCase(), 520)}`, W / 2, 1624);

  drawStoryFooter(ctx, options.vip, v.muted, fonts);
}

/* ================================================================== */
/* Shared Drawing Helpers                                              */
/* ================================================================== */
function drawStoryFooter(ctx: CanvasRenderingContext2D, vip: boolean, color: string, fonts: Fonts): void {
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  if (vip) {
    setFont(ctx, fonts.mono, 22, "600");
    ctx.globalAlpha = 0.72;
    ctx.fillText("GRAVEYARD  •  graveyard.rip", W / 2, 1796);
  } else {
    setFont(ctx, fonts.mono, 24, "700");
    ctx.globalAlpha = 0.9;
    ctx.fillText("DIBUAT DI GRAVEYARD  •  graveyard.rip", W / 2, 1796);
  }
  ctx.restore();
}

function drawFilmGrain(ctx: CanvasRenderingContext2D, count: number, alpha: number): void {
  ctx.save();
  for (let i = 0; i < count; i += 1) {
    const x = ((i * 7919) % W);
    const y = ((i * 104729) % H);
    const bright = i % 2 === 0;
    ctx.fillStyle = bright ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha * 1.4})`;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();
}

function traceSerratedPaper(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  toothW: number,
  toothH: number,
): void {
  const count = Math.floor(w / toothW);
  const actualW = w / count;
  ctx.beginPath();
  ctx.moveTo(x, y + toothH);
  // Top serrated edge
  for (let i = 0; i < count; i += 1) {
    ctx.lineTo(x + i * actualW + actualW / 2, y);
    ctx.lineTo(x + (i + 1) * actualW, y + toothH);
  }
  // Right edge
  ctx.lineTo(x + w, y + h - toothH);
  // Bottom serrated edge
  for (let i = count - 1; i >= 0; i -= 1) {
    ctx.lineTo(x + i * actualW + actualW / 2, y + h);
    ctx.lineTo(x + i * actualW, y + h - toothH);
  }
  ctx.closePath();
}

function traceMonumentShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: NisanTema,
): void {
  ctx.beginPath();
  if (theme === "beton-retak") {
    roundRect(ctx, x, y, w, h, 8);
    return;
  }
  if (theme === "y2k-chrome") {
    const cut = 54;
    ctx.moveTo(x + cut, y);
    ctx.lineTo(x + w - cut, y);
    ctx.lineTo(x + w, y + cut);
    ctx.lineTo(x + w, y + h - 10);
    ctx.lineTo(x + w - 10, y + h);
    ctx.lineTo(x + 10, y + h);
    ctx.lineTo(x, y + h - 10);
    ctx.lineTo(x, y + cut);
    ctx.closePath();
    return;
  }
  if (theme === "batu-lapuk") {
    roundRect(ctx, x, y, w, h, 26);
    return;
  }
  // Arched Gothic / Classical Monument for Obsidian, Marmer Lumut, Crimson Velvet
  const archR = w * 0.46;
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + archR * 0.62);
  ctx.quadraticCurveTo(x, y, x + w / 2, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + archR * 0.62);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

function drawPedestalTier(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  topColor: string,
  bottomColor: string,
  strokeColor: string,
): void {
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, topColor);
  grad.addColorStop(1, bottomColor);
  ctx.fillStyle = grad;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.8;
  ctx.stroke();
}

function drawFloatingPetals(ctx: CanvasRenderingContext2D, theme: NisanTema): void {
  const petalColor =
    theme === "marmer-lumut" ? "#6ee7b7" :
    theme === "y2k-chrome" ? "#38bdf8" :
    theme === "crimson-velvet" ? "#fda4af" : "#fbbf24";
  const petals = [
    { x: 148, y: 390, r: 0.4, s: 1.2 },
    { x: 920, y: 440, r: -0.6, s: 1.0 },
    { x: 118, y: 820, r: 0.9, s: 0.9 },
    { x: 952, y: 780, r: -0.3, s: 1.3 },
    { x: 175, y: 1210, r: 0.5, s: 1.1 },
    { x: 910, y: 1140, r: -0.8, s: 0.95 },
    { x: 260, y: 290, r: 0.2, s: 0.85 },
    { x: 820, y: 310, r: -0.5, s: 0.9 },
  ];
  ctx.save();
  petals.forEach((p) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.r);
    ctx.scale(p.s, p.s);
    ctx.fillStyle = petalColor;
    ctx.globalAlpha = 0.72;
    ctx.shadowColor = petalColor;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}

function drawGlassPill(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  text: string,
  fill: string,
  stroke: string,
  textColor: string,
  fontFamily: string,
  fontSize: number,
  padX = 28,
  padY = 16,
): void {
  setFont(ctx, fontFamily, fontSize, "600");
  const textW = ctx.measureText(text).width;
  const pillW = textW + padX * 2;
  const pillH = fontSize + padY * 2;
  ctx.save();
  ctx.fillStyle = fill;
  roundRect(ctx, centerX - pillW / 2, centerY - pillH / 2, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = textColor;
  ctx.fillText(text, centerX, centerY + fontSize * 0.35);
  ctx.restore();
}

function drawBarcode(
  ctx: CanvasRenderingContext2D,
  seed: string,
  x: number,
  y: number,
  width: number,
  height: number,
  color = "#18181B",
): void {
  const bars = 68;
  const unit = width / bars;
  let code = 2166136261;
  for (const char of seed) {
    code ^= char.charCodeAt(0);
    code = Math.imul(code, 16777619) >>> 0;
  }
  ctx.fillStyle = color;
  for (let i = 0; i < bars; i += 1) {
    // Guard bars at start, middle, and end for realistic thermal barcode look
    const isGuard = i === 0 || i === 2 || i === bars - 1 || i === bars - 3 || i === Math.floor(bars / 2);
    if (isGuard) {
      ctx.fillRect(x + i * unit, y, Math.max(unit * 0.9, 2), height + 10);
      continue;
    }
    const v = ((code >>> (i % 24)) + i * 29) % 11;
    if (v < 4) continue;
    const barW = v >= 9 ? unit * 2.1 : v >= 7 ? unit * 1.4 : unit * 0.85;
    ctx.fillRect(x + i * unit, y, Math.min(barW, width - i * unit), height);
  }
}

function setFont(ctx: CanvasRenderingContext2D, family: string, size: number, weight = "400"): void {
  ctx.font = `${weight} ${size}px ${family}`;
}

function divider(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, color: string, width = 1.5): void {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
}

function dashed(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, color: string, width = 2): void {
  ctx.save();
  ctx.setLineDash([10, 8]);
  divider(ctx, x1, x2, y, color, width);
  ctx.restore();
}

function dotted(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, color: string, width = 2): void {
  ctx.save();
  ctx.setLineDash([3, 8]);
  divider(ctx, x1, x2, y, color, width);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
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
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    if (lines.length === maxLines - 1) {
      current = words.slice(index).join(" ");
      break;
    }
    current = words[index];
  }
  if (current && lines.length < maxLines) lines.push(current);
  const result = lines.slice(0, maxLines);
  result[result.length - 1] = fit(ctx, result[result.length - 1] ?? "", maxWidth);
  return result;
}
