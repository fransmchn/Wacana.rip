import { getTemaNisan } from "@/lib/themes";
import { formatCompactRupiah, formatTanggal, getDurasiHari, getLabelDurasi } from "@/lib/utils";
import type { Makam, NisanTema } from "@/types/graveyard";

export type StoryTemplate = "struk" | "wrapped" | "aura";

export const STORY_TEMPLATES: Array<{ id: StoryTemplate; label: string; hint: string }> = [
  { id: "struk", label: "Struk Kegagalan", hint: "Thermal receipt" },
  { id: "wrapped", label: "Failure Wrapped", hint: "Minimalist editorial" },
  { id: "aura", label: "Brutalist Aura", hint: "Duotone poster" },
];

export interface StoryRenderOptions {
  template: StoryTemplate;
  vip: boolean;
  theme: NisanTema;
}

export type ShareStoryOutcome = "shared" | "cancelled" | "fallback";

interface Fonts {
  serif: string;
  mono: string;
  sans: string;
}

interface DuotonePalette {
  base: string;
  orbA: string;
  orbB: string;
  orbC: string;
  accent: string;
  accentInk: string;
  ink: string;
  muted: string;
  grid: string;
  marqueeBg: string;
  marqueeInk: string;
}

const W = 1080;
const H = 1920;

const DUOTONE_PALETTES: Record<NisanTema, DuotonePalette> = {
  "batu-lapuk": {
    base: "#0B0B0D",
    orbA: "rgba(245, 158, 11, 0.58)",
    orbB: "rgba(161, 161, 170, 0.45)",
    orbC: "rgba(217, 119, 6, 0.35)",
    accent: "#F59E0B",
    accentInk: "#0B0B0D",
    ink: "#FAFAFA",
    muted: "#D4D4D8",
    grid: "rgba(255, 255, 255, 0.11)",
    marqueeBg: "#F59E0B",
    marqueeInk: "#09090B",
  },
  "beton-retak": {
    base: "#090D16",
    orbA: "rgba(59, 130, 246, 0.62)",
    orbB: "rgba(148, 163, 184, 0.46)",
    orbC: "rgba(30, 64, 175, 0.48)",
    accent: "#93C5FD",
    accentInk: "#090D16",
    ink: "#F8FAFC",
    muted: "#CBD5E1",
    grid: "rgba(203, 213, 225, 0.13)",
    marqueeBg: "#E2E8F0",
    marqueeInk: "#0F172A",
  },
  "obsidian-emas": {
    base: "#080706",
    orbA: "rgba(245, 158, 11, 0.72)",
    orbB: "rgba(250, 204, 21, 0.52)",
    orbC: "rgba(180, 83, 9, 0.56)",
    accent: "#FBBF24",
    accentInk: "#09090B",
    ink: "#FFFBEB",
    muted: "#FDE68A",
    grid: "rgba(251, 191, 36, 0.15)",
    marqueeBg: "#FBBF24",
    marqueeInk: "#09090B",
  },
  "marmer-lumut": {
    base: "#02120D",
    orbA: "rgba(16, 185, 129, 0.72)",
    orbB: "rgba(110, 231, 183, 0.48)",
    orbC: "rgba(6, 95, 70, 0.64)",
    accent: "#6EE7B7",
    accentInk: "#02120D",
    ink: "#ECFDF5",
    muted: "#A7F3D0",
    grid: "rgba(110, 231, 183, 0.14)",
    marqueeBg: "#34D399",
    marqueeInk: "#022C22",
  },
  "y2k-chrome": {
    base: "#090914",
    orbA: "rgba(168, 85, 247, 0.76)",
    orbB: "rgba(56, 189, 248, 0.72)",
    orbC: "rgba(236, 72, 153, 0.46)",
    accent: "#38BDF8",
    accentInk: "#090914",
    ink: "#FFFFFF",
    muted: "#E0F2FE",
    grid: "rgba(56, 189, 248, 0.18)",
    marqueeBg: "#38BDF8",
    marqueeInk: "#090914",
  },
  "crimson-velvet": {
    base: "#120306",
    orbA: "rgba(225, 29, 72, 0.78)",
    orbB: "rgba(251, 113, 133, 0.52)",
    orbC: "rgba(127, 29, 29, 0.72)",
    accent: "#FDA4AF",
    accentInk: "#120306",
    ink: "#FFF1F2",
    muted: "#FECDD3",
    grid: "rgba(253, 164, 175, 0.15)",
    marqueeBg: "#FDA4AF",
    marqueeInk: "#450A0A",
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

async function renderStoryBlob(makam: Makam, options: StoryRenderOptions): Promise<Blob> {
  const canvas = document.createElement("canvas");
  await renderStoryCanvas(canvas, makam, options, 1);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Gagal mengonversi kanvas ke gambar PNG."));
    }, "image/png");
  });
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadStoryPng(makam: Makam, options: StoryRenderOptions): Promise<void> {
  const blob = await renderStoryBlob(makam, options);
  triggerBlobDownload(blob, `graveyard-story-${options.template}-${makam.id.slice(-8)}.png`);
}

/** Bagikan PNG 1080×1920 via Web Share API Level 2 (IG Story / Apps), dengan fallback unduh + salin teks di desktop. */
export async function shareStoryImage(makam: Makam, options: StoryRenderOptions): Promise<ShareStoryOutcome> {
  const blob = await renderStoryBlob(makam, options);
  const file = new File([blob], "graveyard-story.png", { type: "image/png" });
  const shareText = `Baru saja mengubur mimpi "${makam.judul}" di GRAVEYARD 💀`;

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    typeof navigator.share === "function"
  ) {
    let supportsFiles = false;
    try {
      supportsFiles = navigator.canShare({ files: [file] });
    } catch {
      supportsFiles = false;
    }

    if (supportsFiles) {
      try {
        await navigator.share({
          files: [file],
          title: "GRAVEYARD",
          text: shareText,
        });
        return "shared";
      } catch (reason) {
        if (reason instanceof Error && reason.name === "AbortError") {
          return "cancelled";
        }
        throw reason;
      }
    }
  }

  // Fallback desktop: unduh PNG + salin teks & tautan ke clipboard
  triggerBlobDownload(blob, "graveyard-story.png");
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://graveyard.rip";
    try {
      await navigator.clipboard.writeText(`${shareText} — ${shareUrl}`);
    } catch {
      /* Clipboard mungkin diblokir browser; unduhan tetap berhasil. */
    }
  }
  return "fallback";
}

function drawStory(ctx: CanvasRenderingContext2D, makam: Makam, options: StoryRenderOptions, fonts: Fonts): void {
  if (options.template === "struk") drawReceipt(ctx, makam, options, fonts);
  else if (options.template === "wrapped") drawFailureWrapped(ctx, makam, options, fonts);
  else drawBrutalistAura(ctx, makam, options, fonts);
}

/* ================================================================== */
/* 1. Receiptify / Struk Kegagalan (Kept Intact)                       */
/* ================================================================== */
function drawReceipt(ctx: CanvasRenderingContext2D, makam: Makam, options: StoryRenderOptions, fonts: Fonts): void {
  ctx.fillStyle = "#0C0C0E";
  ctx.fillRect(0, 0, W, H);

  const bgGlow = ctx.createRadialGradient(W / 2, H * 0.42, 60, W / 2, H * 0.42, 820);
  bgGlow.addColorStop(0, "rgba(245, 158, 11, 0.12)");
  bgGlow.addColorStop(0.55, "rgba(255, 255, 255, 0.03)");
  bgGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, W, H);

  drawFilmGrain(ctx, 1800, 0.055);

  const pw = 840;
  const ph = 1520;
  const px = -pw / 2;
  const py = -ph / 2;
  const tooth = 24;
  const toothH = 15;

  ctx.save();
  ctx.translate(W / 2, H / 2 - 16);
  ctx.rotate(-0.022);

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.78)";
  ctx.shadowBlur = 72;
  ctx.shadowOffsetX = 14;
  ctx.shadowOffsetY = 34;
  traceSerratedPaper(ctx, px, py, pw, ph, tooth, toothH);
  ctx.fillStyle = "#F4F1EA";
  ctx.fill();
  ctx.restore();

  ctx.save();
  traceSerratedPaper(ctx, px, py, pw, ph, tooth, toothH);
  ctx.clip();

  const paperGrad = ctx.createLinearGradient(px, py, px + pw, py + ph);
  paperGrad.addColorStop(0, "#F7F4EE");
  paperGrad.addColorStop(0.45, "#F2EFE7");
  paperGrad.addColorStop(0.52, "#EAE5DA");
  paperGrad.addColorStop(1, "#F5F2EB");
  ctx.fillStyle = paperGrad;
  ctx.fillRect(px, py, pw, ph);

  const crease = ctx.createLinearGradient(0, -140, 0, -90);
  crease.addColorStop(0, "rgba(0, 0, 0, 0)");
  crease.addColorStop(0.48, "rgba(28, 25, 23, 0.06)");
  crease.addColorStop(0.54, "rgba(255, 255, 255, 0.45)");
  crease.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = crease;
  ctx.fillRect(px, -140, pw, 50);

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
    ctx.textAlign = "left";
    setFont(ctx, fonts.mono, 21, "700");
    ctx.fillStyle = inkSoft;
    ctx.fillText(row.label, left, cursorY);
    const labelW = ctx.measureText(row.label).width;

    ctx.textAlign = "right";
    setFont(ctx, fonts.mono, 24, "600");
    ctx.fillStyle = ink;
    const maxValW = Math.min(440, innerW - labelW - 44);
    const valText = fit(ctx, row.value, maxValW);
    const valW = ctx.measureText(valText).width;
    ctx.fillText(valText, right, cursorY);

    const dotStart = left + labelW + 14;
    const dotEnd = right - valW - 14;
    if (dotEnd > dotStart + 10) {
      dotted(ctx, dotStart, dotEnd, cursorY - 4, "rgba(28, 25, 23, 0.35)", 2);
    }
    cursorY += 76;
  });

  dashed(ctx, left, right, cursorY - 12, "rgba(28, 25, 23, 0.45)", 2);

  cursorY += 42;
  ctx.textAlign = "left";
  setFont(ctx, fonts.mono, 28, "700");
  ctx.fillStyle = ink;
  ctx.fillText("TOTAL DAMAGE", left, cursorY);
  ctx.textAlign = "right";
  ctx.fillText(financialLoss, right, cursorY);

  cursorY += 68;
  ctx.textAlign = "center";
  setFont(ctx, fonts.serif, 32, "italic 500");
  ctx.fillStyle = "#3F3A36";
  const epitaphLines = wrap(ctx, `“${makam.epitaph}”`, innerW - 40, 2);
  epitaphLines.forEach((line, idx) => {
    ctx.fillText(line, 0, cursorY + idx * 44);
  });

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

  const barcodeY = py + ph - 246;
  drawBarcode(ctx, `${makam.id}-${makam.judul}`, -270, barcodeY, 540, 118, "#18181B");

  setFont(ctx, fonts.mono, 21, "600");
  ctx.fillStyle = inkSoft;
  ctx.fillText(`* ${makam.id.slice(-12).toUpperCase()} *`, 0, barcodeY + 150);

  setFont(ctx, fonts.mono, 18, "500");
  ctx.fillStyle = "#78716C";
  ctx.fillText("GRAVEYARD.RIP — DIGITAL MEMORIAL", 0, py + ph - 48);

  ctx.restore();
  ctx.restore();

  drawStoryFooter(ctx, options.vip, "rgba(244, 241, 234, 0.72)", fonts);
}

/* ================================================================== */
/* 2. Failure Wrapped — Calm Minimalist Editorial / Dark-Wrapped      */
/* ================================================================== */
function drawFailureWrapped(ctx: CanvasRenderingContext2D, makam: Makam, options: StoryRenderOptions, fonts: Fonts): void {
  const durasi = getDurasiHari(makam.tanggalMulai, makam.tanggalMenyerah);
  const BG = "#111113";
  const INK = "#F4F4F5";
  const ZINC = "#A1A1AA";
  const ZINC_DIM = "#71717A";
  const GOLD = "#EAB308";

  // 1. Deep matte obsidian/charcoal base (#111113)
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // 2. Soft, eye-friendly ambient spotlight gradients (warm slate + restrained champagne gold)
  const slateGlow = ctx.createRadialGradient(W * 0.24, H * 0.16, 40, W * 0.24, H * 0.16, 860);
  slateGlow.addColorStop(0, "rgba(148, 163, 184, 0.085)");
  slateGlow.addColorStop(0.55, "rgba(100, 116, 139, 0.03)");
  slateGlow.addColorStop(1, "rgba(17, 17, 19, 0)");
  ctx.fillStyle = slateGlow;
  ctx.fillRect(0, 0, W, H);

  const goldGlow = ctx.createRadialGradient(W * 0.56, H * 0.44, 30, W * 0.56, H * 0.44, 720);
  goldGlow.addColorStop(0, "rgba(234, 179, 8, 0.085)");
  goldGlow.addColorStop(0.55, "rgba(234, 179, 8, 0.025)");
  goldGlow.addColorStop(1, "rgba(17, 17, 19, 0)");
  ctx.fillStyle = goldGlow;
  ctx.fillRect(0, 0, W, H);

  // Subtle tactile matte grain
  drawFilmGrain(ctx, 1600, 0.028);

  // Quiet architectural Swiss hairline frame
  ctx.strokeStyle = "rgba(244, 244, 245, 0.085)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 64, 128, W - 128, H - 256, 20);
  ctx.stroke();

  // 3. Subtle Top Archive Tag
  ctx.textAlign = "center";
  setFont(ctx, fonts.mono, 21, "500");
  ctx.fillStyle = ZINC;
  ctx.fillText("ARCHIVE 2026  •  GRAVEYARD", W / 2, 224);

  // Refined warm-gold vertical accent tick
  ctx.beginPath();
  ctx.strokeStyle = "rgba(234, 179, 8, 0.55)";
  ctx.lineWidth = 1.5;
  ctx.moveTo(W / 2, 258);
  ctx.lineTo(W / 2, 314);
  ctx.stroke();

  // Category & Lifespan Eyebrow
  setFont(ctx, fonts.mono, 21, "600");
  ctx.fillStyle = GOLD;
  const yearRange = `${makam.tanggalMulai.slice(0, 4)} — ${makam.tanggalMenyerah.slice(0, 4)}`;
  const statusTag = options.vip ? "ABADI VIP" : makam.kategori.toUpperCase();
  ctx.fillText(`${statusTag}  ·  ${yearRange}`, W / 2, 376);

  // 4. Expressive Serif Hero Title with Generous Breathing Room
  setFont(ctx, fonts.serif, 76, "600");
  ctx.fillStyle = INK;
  const heroLines = wrap(ctx, makam.judul, W - 220, 3);
  const titleLineH = 94;
  const titleStartY = heroLines.length === 1 ? 548 : heroLines.length === 2 ? 506 : 472;
  heroLines.forEach((line, idx) => {
    ctx.fillText(line, W / 2, titleStartY + idx * titleLineH);
  });

  // 5. Refined Horizontal Hairline Divider with Gold Center Accent
  const ruleTopY = 790;
  divider(ctx, 132, W - 132, ruleTopY, "rgba(244, 244, 245, 0.13)", 1.5);
  divider(ctx, W / 2 - 36, W / 2 + 36, ruleTopY, GOLD, 2.5);

  // 6. Clean 2-Column Stat Typography (KERUGIAN & WAKTU)
  const lossText = makam.kerugianRupiah ? formatCompactRupiah(makam.kerugianRupiah) : "Rp 0";
  const timeText = makam.kerugianJam ? `${makam.kerugianJam} jam` : getLabelDurasi(durasi);

  const colLeftX = W * 0.295;
  const colRightX = W * 0.705;
  const statLabelY = 892;
  const statValY = 980;
  const statSubY = 1038;

  // Vertical hairline separating columns
  ctx.beginPath();
  ctx.strokeStyle = "rgba(244, 244, 245, 0.11)";
  ctx.lineWidth = 1.5;
  ctx.moveTo(W / 2, 856);
  ctx.lineTo(W / 2, 1062);
  ctx.stroke();

  // Left Column: KERUGIAN
  ctx.textAlign = "center";
  setFont(ctx, fonts.mono, 19, "600");
  ctx.fillStyle = ZINC;
  ctx.fillText("KERUGIAN", colLeftX, statLabelY);

  setFont(ctx, fonts.sans, 64, "600");
  ctx.fillStyle = INK;
  ctx.fillText(fit(ctx, lossText, 360), colLeftX, statValY);

  setFont(ctx, fonts.mono, 18, "400");
  ctx.fillStyle = ZINC_DIM;
  ctx.fillText(`${makam.bunga} bunga ditabur`, colLeftX, statSubY);

  // Right Column: WAKTU
  setFont(ctx, fonts.mono, 19, "600");
  ctx.fillStyle = ZINC;
  ctx.fillText("WAKTU", colRightX, statLabelY);

  setFont(ctx, fonts.sans, 64, "600");
  ctx.fillStyle = INK;
  ctx.fillText(fit(ctx, timeText, 360), colRightX, statValY);

  setFont(ctx, fonts.mono, 18, "400");
  ctx.fillStyle = ZINC_DIM;
  ctx.fillText(`Hidup ${getLabelDurasi(durasi)}`, colRightX, statSubY);

  // Second Hairline Divider
  divider(ctx, 132, W - 132, 1126, "rgba(244, 244, 245, 0.11)", 1.5);

  // 7. Short Italicized Epitaph Quote
  setFont(ctx, fonts.serif, 86, "400");
  ctx.fillStyle = GOLD;
  ctx.globalAlpha = 0.72;
  ctx.fillText("“", W / 2, 1244);
  ctx.globalAlpha = 1;

  setFont(ctx, fonts.serif, 46, "italic 500");
  ctx.fillStyle = INK;
  const epLines = wrap(ctx, makam.epitaph, W - 260, 3);
  const epStartY = epLines.length === 1 ? 1330 : epLines.length === 2 ? 1308 : 1286;
  epLines.forEach((line, idx) => {
    ctx.fillText(line, W / 2, epStartY + idx * 64);
  });

  // Quiet Cause of Death Line
  setFont(ctx, fonts.mono, 17, "500");
  ctx.fillStyle = ZINC_DIM;
  ctx.fillText("PENYEBAB GUGUR", W / 2, 1528);

  setFont(ctx, fonts.sans, 26, "400");
  ctx.fillStyle = ZINC;
  ctx.fillText(fit(ctx, makam.penyebab, W - 260), W / 2, 1570);

  // 8. Minimalist Bottom Signature Bar
  divider(ctx, 132, W - 132, 1662, "rgba(244, 244, 245, 0.1)", 1.5);

  setFont(ctx, fonts.mono, 21, "500");
  ctx.fillStyle = ZINC;
  const author = fit(ctx, makam.pembuat.toUpperCase(), 380);
  ctx.fillText(`BURIED BY ${author}  •  GRAVEYARD.RIP`, W / 2, 1732);
}

/* ================================================================== */
/* 3. Brutalist Aura / Top Flop Poster (Duotone Swiss Poster Style)    */
/* ================================================================== */
function drawBrutalistAura(ctx: CanvasRenderingContext2D, makam: Makam, options: StoryRenderOptions, fonts: Fonts): void {
  const p = DUOTONE_PALETTES[options.theme];
  const tema = getTemaNisan(options.theme);
  const durasi = getDurasiHari(makam.tanggalMulai, makam.tanggalMenyerah);

  // 1. Vivid Duotone Radial Aurora Background synced to monument theme
  ctx.fillStyle = p.base;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  const orb1 = ctx.createRadialGradient(W * 0.2, H * 0.24, 40, W * 0.2, H * 0.24, 780);
  orb1.addColorStop(0, p.orbA);
  orb1.addColorStop(0.55, p.orbC);
  orb1.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = orb1;
  ctx.fillRect(0, 0, W, H);

  const orb2 = ctx.createRadialGradient(W * 0.86, H * 0.54, 40, W * 0.86, H * 0.54, 820);
  orb2.addColorStop(0, p.orbB);
  orb2.addColorStop(0.55, p.orbA);
  orb2.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = orb2;
  ctx.fillRect(0, 0, W, H);

  const orb3 = ctx.createRadialGradient(W * 0.34, H * 0.84, 30, W * 0.34, H * 0.84, 680);
  orb3.addColorStop(0, p.orbC);
  orb3.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = orb3;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Subtle dark vignette at edges for maximum foreground typography contrast
  const vig = ctx.createRadialGradient(W / 2, H / 2, 340, W / 2, H / 2, 1180);
  vig.addColorStop(0, "rgba(0, 0, 0, 0)");
  vig.addColorStop(1, "rgba(0, 0, 0, 0.52)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // 2. Bold Architectural Swiss Grid Lines + Registration Crosshairs
  ctx.save();
  ctx.strokeStyle = p.grid;
  ctx.lineWidth = 1.5;
  const cols = [72, 360, 720, W - 72];
  const rows = [140, 570, 1080, 1580];
  cols.forEach((x) => {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  });
  rows.forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  });
  // Swiss '+' crosshairs at intersections
  ctx.strokeStyle = p.accent;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2;
  cols.forEach((x) => {
    rows.forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(x - 10, y);
      ctx.lineTo(x + 10, y);
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x, y + 10);
      ctx.stroke();
    });
  });
  ctx.restore();

  // 3. Giant Background Watermark Numerals ("2026")
  ctx.save();
  ctx.textAlign = "center";
  setFont(ctx, fonts.sans, 410, "700");
  ctx.fillStyle = "#FFFFFF";
  ctx.globalAlpha = 0.065;
  ctx.fillText("2026", W / 2, 540);
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 2.5;
  ctx.strokeText("2026", W / 2, 540);
  ctx.restore();

  drawFilmGrain(ctx, 2200, 0.05);

  // 4. Top Swiss Index Header
  const margin = 76;
  ctx.textAlign = "left";
  setFont(ctx, fonts.mono, 22, "700");
  ctx.fillStyle = p.ink;
  ctx.fillText("01 // YOUR FAILURE AURA", margin, 198);

  ctx.textAlign = "right";
  ctx.fillStyle = p.accent;
  ctx.fillText(`${tema.label.toUpperCase()}${options.vip ? " · VIP" : ""}`, W - margin, 198);

  // 5. Asymmetric Top Subject Block (Left-aligned)
  ctx.textAlign = "left";
  setFont(ctx, fonts.mono, 20, "600");
  ctx.fillStyle = p.accent;
  ctx.fillText(`${makam.kategori.toUpperCase()}  •  ${makam.tanggalMulai.slice(0, 4)}—${makam.tanggalMenyerah.slice(0, 4)}`, margin, 290);

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
  ctx.shadowBlur = 24;
  setFont(ctx, fonts.sans, 72, "700");
  ctx.fillStyle = p.ink;
  const subLines = wrap(ctx, makam.judul.toUpperCase(), W - margin * 2, 3);
  subLines.forEach((line, idx) => {
    ctx.fillText(line, margin, 374 + idx * 80);
  });
  ctx.restore();

  // 6. Centerpiece Huge Stacked Quote / Epitaph + Oversized Opening Quote Glyph
  const quoteAnchorY = 795;

  // Oversized opening quote glyph
  ctx.save();
  ctx.textAlign = "left";
  setFont(ctx, fonts.serif, 360, "700");
  ctx.fillStyle = p.accent;
  ctx.globalAlpha = 0.36;
  ctx.fillText("“", 42, quoteAnchorY + 86);
  ctx.restore();

  // Huge stacked Playfair Display italic quote directly over duotone aura (no box!)
  ctx.save();
  ctx.textAlign = "left";
  ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
  ctx.shadowBlur = 28;
  setFont(ctx, fonts.serif, 74, "italic 700");
  ctx.fillStyle = p.ink;
  const epLines = wrap(ctx, makam.epitaph, W - 188, 4);
  const epStartY = epLines.length <= 2 ? quoteAnchorY + 95 : quoteAnchorY + 38;
  epLines.forEach((line, idx) => {
    ctx.fillText(line, 108, epStartY + idx * 88);
  });
  ctx.restore();

  // Asymmetric Cause & Stats Strip below quote (directly on Swiss grid)
  const metaY = 1235;
  divider(ctx, margin, W - margin, metaY - 46, p.accent, 2.5);

  ctx.textAlign = "left";
  setFont(ctx, fonts.mono, 20, "700");
  ctx.fillStyle = p.accent;
  ctx.fillText("PENYEBAB GUGUR", margin, metaY);

  setFont(ctx, fonts.sans, 34, "600");
  ctx.fillStyle = p.ink;
  const causeLines = wrap(ctx, makam.penyebab, 560, 2);
  causeLines.forEach((line, idx) => {
    ctx.fillText(line, margin, metaY + 46 + idx * 42);
  });

  const lossText = makam.kerugianRupiah ? formatCompactRupiah(makam.kerugianRupiah) : "Rp 0";
  setFont(ctx, fonts.mono, 23, "700");
  ctx.fillStyle = p.muted;
  ctx.fillText(
    `RUGI ${lossText}  //  ${getLabelDurasi(durasi).toUpperCase()}  //  ${makam.bunga} ✿`,
    margin,
    1445,
  );

  // User signature line
  setFont(ctx, fonts.mono, 19, "600");
  ctx.fillStyle = p.accent;
  ctx.fillText("BURIED BY", margin, 1520);
  setFont(ctx, fonts.sans, 34, "700");
  ctx.fillStyle = p.ink;
  ctx.fillText(fit(ctx, makam.pembuat.toUpperCase(), 520), margin, 1562);

  // 7. Giant "R.I.P." Stamp Badge rotated +8deg
  ctx.save();
  ctx.translate(822, 1396);
  ctx.rotate(0.14); // +8deg

  ctx.fillStyle = "rgba(9, 9, 11, 0.88)";
  roundRect(ctx, -188, -110, 376, 220, 16);
  ctx.fill();

  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 7;
  ctx.stroke();

  ctx.strokeStyle = p.accent;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 2;
  roundRect(ctx, -172, -94, 344, 188, 10);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.textAlign = "center";
  setFont(ctx, fonts.serif, 102, "700");
  ctx.fillStyle = p.accent;
  ctx.fillText("R.I.P.", 0, 24);

  setFont(ctx, fonts.mono, 22, "700");
  ctx.fillStyle = p.ink;
  ctx.fillText(options.vip ? "★ ABADI VIP ★" : "CERTIFIED GUGUR", 0, 68);
  ctx.restore();

  // 8. Bottom Full-Bleed Brutalist Marquee Strip
  const marqueeY = 1662;
  const marqueeH = 74;
  ctx.save();
  ctx.fillStyle = p.marqueeBg;
  ctx.fillRect(0, marqueeY, W, marqueeH);

  ctx.textAlign = "left";
  setFont(ctx, fonts.mono, 28, "700");
  ctx.fillStyle = p.marqueeInk;
  const ticker = "GRAVEYARD • CERTIFIED GUGUR • NO REGRETS • GRAVEYARD • CERTIFIED GUGUR • NO REGRETS •";
  ctx.fillText(ticker, -24, marqueeY + 47);
  ctx.restore();

  // Clean bottom safe-zone signature
  drawStoryFooter(ctx, options.vip, p.muted, fonts);
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
    ctx.globalAlpha = 0.78;
    ctx.fillText("GRAVEYARD  •  graveyard.rip", W / 2, 1812);
  } else {
    setFont(ctx, fonts.mono, 24, "700");
    ctx.globalAlpha = 0.92;
    ctx.fillText("DIBUAT DI GRAVEYARD  •  graveyard.rip", W / 2, 1812);
  }
  ctx.restore();
}

function drawFilmGrain(ctx: CanvasRenderingContext2D, count: number, alpha: number): void {
  ctx.save();
  for (let i = 0; i < count; i += 1) {
    const x = (i * 7919) % W;
    const y = (i * 104729) % H;
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
  for (let i = 0; i < count; i += 1) {
    ctx.lineTo(x + i * actualW + actualW / 2, y);
    ctx.lineTo(x + (i + 1) * actualW, y + toothH);
  }
  ctx.lineTo(x + w, y + h - toothH);
  for (let i = count - 1; i >= 0; i -= 1) {
    ctx.lineTo(x + i * actualW + actualW / 2, y + h);
    ctx.lineTo(x + i * actualW, y + h - toothH);
  }
  ctx.closePath();
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
