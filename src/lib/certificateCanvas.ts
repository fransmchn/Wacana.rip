import { formatKerugian, formatTanggal, getDurasiHari, getLabelDurasi } from "@/lib/utils";
import type { Kategori, Makam } from "@/types/graveyard";

const W = 1080;
const H = 1920;
const GOLD = "#d8ad69";
const INK = "#f4f1e9";
const MUTED = "#a7a69f";

const categoryLabel: Record<Kategori, string> = {
  skripsi: "Skripsi & riset", koding: "Koding & teknologi", desain: "Desain & karya",
  bisnis: "Bisnis & usaha", resolusi: "Resolusi & hobi", hubungan: "Hubungan",
  pribadi: "Hal pribadi", pekerjaan: "Pekerjaan & karier", keluarga: "Keluarga",
  kesehatan: "Kesehatan", perjalanan: "Perjalanan", lainnya: "Lainnya",
};

/** Akta 9:16 untuk social story. Render sepenuhnya di browser, tanpa server. */
export async function downloadAktaPng(makam: Makam): Promise<void> {
  await document.fonts?.ready;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Kanvas tidak tersedia di peramban ini.");

  const theme = getComputedStyle(document.documentElement);
  const serif = theme.getPropertyValue("--font-playfair").trim() || "Georgia, serif";
  const mono = theme.getPropertyValue("--font-jetbrains-mono").trim() || "monospace";
  const sans = theme.getPropertyValue("--font-space-grotesk").trim() || "sans-serif";

  drawBackground(ctx);
  drawHeader(ctx, mono);
  const afterTitle = drawTitle(ctx, makam.judul, serif);
  drawEpitaph(ctx, makam.epitaph, serif, afterTitle + 90);
  drawFacts(ctx, makam, mono, sans);
  drawFooter(ctx, makam, mono);

  const link = document.createElement("a");
  link.download = `akta-kematian-${makam.id.slice(-8)}.png`;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, 340, 40, W / 2, 340, 980);
  glow.addColorStop(0, "rgba(216,173,105,.18)");
  glow.addColorStop(.55, "rgba(216,173,105,.045)");
  glow.addColorStop(1, "rgba(216,173,105,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 1100);

  ctx.strokeStyle = "rgba(216,173,105,.5)";
  ctx.lineWidth = 2;
  roundRect(ctx, 54, 54, W - 108, H - 108, 28);
  ctx.stroke();
  ctx.strokeStyle = "rgba(216,173,105,.16)";
  roundRect(ctx, 72, 72, W - 144, H - 144, 20);
  ctx.stroke();
}

function drawHeader(ctx: CanvasRenderingContext2D, mono: string) {
  ctx.textAlign = "center";
  setFont(ctx, mono, 25, "600");
  ctx.fillStyle = GOLD;
  ctx.letterSpacing = "8px";
  ctx.fillText("WACANA.RIP", W / 2, 158);
  ctx.letterSpacing = "0px";
  setFont(ctx, mono, 18, "400");
  ctx.fillStyle = MUTED;
  ctx.fillText("AKTA KEMATIAN WACANA", W / 2, 202);
  divider(ctx, 300, W - 300, 252);
}

function drawTitle(ctx: CanvasRenderingContext2D, title: string, serif: string): number {
  ctx.textAlign = "center";
  setFont(ctx, serif, 68, "600");
  ctx.fillStyle = INK;
  const lines = wrap(ctx, title, W - 200, 3);
  let y = 388;
  for (const line of lines) {
    ctx.fillText(line, W / 2, y);
    y += 80;
  }
  setFont(ctx, serif, 28, "400");
  ctx.fillStyle = MUTED;
  ctx.fillText("dinyatakan gugur dengan hormat", W / 2, y + 12);
  divider(ctx, 420, W - 420, y + 62);
  return y + 62;
}

function drawEpitaph(ctx: CanvasRenderingContext2D, epitaph: string, serif: string, startY: number) {
  ctx.textAlign = "center";
  setFont(ctx, serif, 34, "400");
  ctx.fillStyle = GOLD;
  const lines = wrap(ctx, `“${epitaph}”`, W - 240, 2);
  lines.forEach((line, index) => ctx.fillText(line, W / 2, startY + index * 48));
}

function drawFacts(ctx: CanvasRenderingContext2D, makam: Makam, mono: string, sans: string) {
  const cardY = 880;
  const cardX = 100;
  const cardW = W - 200;
  const cardH = 650;

  ctx.fillStyle = "rgba(244,241,233,.035)";
  roundRect(ctx, cardX, cardY, cardW, cardH, 22);
  ctx.fill();
  ctx.strokeStyle = "rgba(216,173,105,.28)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const rows: Array<[string, string]> = [
    ["Pembuat", makam.pembuat],
    ["Kategori", categoryLabel[makam.kategori]],
    ["Penyebab", makam.penyebab],
    ["Dimulai", formatTanggal(makam.tanggalMulai)],
    ["Gugur", formatTanggal(makam.tanggalMenyerah)],
    ["Masa hidup", getLabelDurasi(getDurasiHari(makam.tanggalMulai, makam.tanggalMenyerah))],
    ["Kerugian", formatKerugian(makam)],
    ["Bunga / lilin", `${makam.bunga} / ${makam.lilinCount ?? (makam.lilin ? 1 : 0)}`],
  ];

  rows.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = cardX + 48 + column * (cardW / 2);
    const y = cardY + 80 + row * 150;
    const maxWidth = cardW / 2 - 88;

    ctx.textAlign = "left";
    setFont(ctx, mono, 17, "500");
    ctx.fillStyle = MUTED;
    ctx.letterSpacing = "2px";
    ctx.fillText(label.toUpperCase(), x, y);
    ctx.letterSpacing = "0px";
    setFont(ctx, sans, 27, "500");
    ctx.fillStyle = INK;
    ctx.fillText(fit(ctx, value, maxWidth), x, y + 44);

    if (row < 3) divider(ctx, x, x + maxWidth, y + 94, "rgba(216,173,105,.12)");
  });
}

function drawFooter(ctx: CanvasRenderingContext2D, makam: Makam, mono: string) {
  divider(ctx, 300, W - 300, 1580);
  ctx.textAlign = "center";
  setFont(ctx, mono, 19, "500");
  ctx.fillStyle = GOLD;
  ctx.letterSpacing = "4px";
  ctx.fillText("DISIMPAN DI WACANA.RIP", W / 2, 1642);
  ctx.letterSpacing = "0px";
  setFont(ctx, mono, 16, "400");
  ctx.fillStyle = MUTED;
  ctx.fillText("TPU WACANA · SETIAP KEGAGALAN PUNYA TEMPAT PULANG", W / 2, 1684);
  ctx.fillText(`AKTA #${makam.id.slice(-8).toUpperCase()}`, W / 2, 1736);
}

function setFont(ctx: CanvasRenderingContext2D, family: string, size: number, weight = "400") {
  ctx.font = `${weight} ${size}px ${family}`;
}

function divider(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, color = "rgba(216,173,105,.32)") {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let value = text;
  while (value.length > 1 && ctx.measureText(`${value}…`).width > maxWidth) value = value.slice(0, -1);
  return `${value.trimEnd()}…`;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  let consumed = 0;

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      consumed += 1;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    consumed += 1;
    if (lines.length === maxLines - 1) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (consumed < words.length && lines.length === maxLines) lines[maxLines - 1] = fit(ctx, `${lines[maxLines - 1]}…`, maxWidth);
  return lines.length ? lines : [""];
}
