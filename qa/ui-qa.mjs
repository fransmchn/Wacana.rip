import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const viewports = [
  { name: "375x667", width: 375, height: 667 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1920x1080", width: 1920, height: 1080 },
];
const results = [];
let server;

async function serverReady() {
  try { return (await fetch(baseURL)).ok; } catch { return false; }
}
if (!(await serverReady())) {
  server = process.platform === "win32"
    ? spawn("cmd.exe", ["/d", "/s", "/c", "npm run dev"], { stdio: "ignore", windowsHide: true })
    : spawn("npm", ["run", "dev"], { stdio: "ignore" });
  for (let attempt = 0; attempt < 60 && !(await serverReady()); attempt += 1) await new Promise((resolve) => setTimeout(resolve, 500));
  if (!(await serverReady())) throw new Error(`QA server unavailable at ${baseURL}`);
}

await mkdir("qa/screens", { recursive: true });
const browser = await chromium.launch({ headless: true });

function contrastRatio(foreground, background) {
  const parse = (value) => value.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
  const luminance = (value) => parse(value).map((channel) => { const s = channel / 255; return s <= .03928 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  const foregroundLum = luminance(foreground);
  const backgroundLum = luminance(background);
  return (Math.max(foregroundLum, backgroundLum) + .05) / (Math.min(foregroundLum, backgroundLum) + .05);
}

async function measure(page, route, viewport) {
  const data = await page.evaluate(({ route }) => {
    const rect = (element) => element.getBoundingClientRect().toJSON();
    const scrolling = document.scrollingElement;
    const overflowElements = [...document.querySelectorAll("body *")].flatMap((element) => {
      if (element.closest(".chip-rail")) return [];
      const box = rect(element);
      return box.right > window.innerWidth + 1 ? [{ tag: element.tagName, className: String(element.className), right: Math.round(box.right), width: Math.round(box.width) }] : [];
    });
    const dimensions = {
      buttons: Object.fromEntries(["sm", "md", "lg"].map((size) => {
        const element = document.querySelector(`.ui-button-${size}:not(.ui-icon-button)`);
        return [size, element ? { height: Math.round(rect(element).height), width: Math.round(rect(element).width) } : null];
      })),
      iconButton: (() => { const element = document.querySelector(".ui-icon-button"); return element ? { width: Math.round(rect(element).width), height: Math.round(rect(element).height) } : null; })(),
      input: (() => { const element = document.querySelector(".ui-input"); return element ? Math.round(rect(element).height) : null; })(),
      chip: (() => { const element = document.querySelector(".ui-chip"); return element ? Math.round(rect(element).height) : null; })(),
    };
    const iconButtons = [...document.querySelectorAll(".ui-button")].filter((element) => element.querySelector("svg") && element.textContent?.trim());
    const iconLayout = iconButtons.map((element) => {
      const icon = element.querySelector("svg");
      const iconBox = rect(icon);
      const labelBox = rect(element.querySelector(".ui-button-label") ?? element);
      return { flexDirection: getComputedStyle(element).flexDirection, verticalDelta: Math.abs((iconBox.top + iconBox.height / 2) - (labelBox.top + labelBox.height / 2)) };
    });
    const cards = [...document.querySelectorAll(".tombstone")];
    const rows = [...new Set(cards.map((card) => Math.round(rect(card).top)))].map((top) => cards.filter((card) => Math.abs(rect(card).top - top) <= 1));
    const cardRows = rows.map((row) => ({ count: row.length, heights: row.map((card) => Math.round(rect(card).height)), actionHeights: row.flatMap((card) => [...card.querySelectorAll(".tombstone-actions .ui-button")].map((button) => Math.round(rect(button).height))) }));
    const reducedMotion = [...document.querySelectorAll("*")].filter((element) => { const style = getComputedStyle(element); return style.animationName !== "none" && style.animationDuration !== "0s"; }).map((element) => ({ tag: element.tagName, className: String(element.className), animation: getComputedStyle(element).animationName }));
    const scrollbar = { htmlColorScheme: getComputedStyle(document.documentElement).colorScheme, htmlScrollbarColor: getComputedStyle(document.documentElement).scrollbarColor, bodyScrollbarColor: getComputedStyle(document.body).scrollbarColor };
    return { route, overflow: { scrollWidth: scrolling?.scrollWidth ?? 0, clientWidth: scrolling?.clientWidth ?? 0, elements: overflowElements }, dimensions, iconLayout, cardRows, reducedMotion, scrollbar };
  }, { route });
  results.push({ route, viewport: viewport.name, ...data });
}

for (const viewport of viewports) {
  for (const route of ["/", "/dev/ui"]) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: "reduce" });
    await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: `qa/screens/${route === "/" ? "home" : "ui"}-${viewport.name}.png`, fullPage: true });
    await measure(page, route, viewport);
    const current = results.at(-1);
    if (route === "/") {
      const login = page.getByRole("button", { name: "Masuk", exact: true });
      if (await login.count()) {
        await login.click();
        await page.screenshot({ path: `qa/screens/home-login-${viewport.name}.png`, fullPage: true });
        current.loginDialog = { visible: await page.locator("[role=dialog]").isVisible(), title: await page.locator("[role=dialog] h2").textContent() };
        await page.keyboard.press("Escape");
      }
      await page.keyboard.press("/");
      current.searchShortcut = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
      const skip = page.locator(".skip-link");
      await skip.focus();
      current.skipLink = { visible: await skip.evaluate((element) => getComputedStyle(element).transform !== "matrix(1, 0, 0, 1, 0, 0)"), target: await skip.getAttribute("href") };
    } else {
      const longButton = page.getByRole("button", { name: "Dialog panjang" });
      await longButton.click();
      await page.screenshot({ path: `qa/screens/ui-dialog-long-${viewport.name}.png`, fullPage: true });
      await page.evaluate(() => document.querySelector(".ui-dialog-body")?.scrollTo(0, 10000));
      current.dialog = await page.evaluate(() => {
        const dialog = document.querySelector("[role=dialog]");
        const header = dialog?.querySelector(".ui-dialog-header")?.getBoundingClientRect();
        const footer = dialog?.querySelector(".ui-dialog-footer")?.getBoundingClientRect();
        const body = dialog?.querySelector(".ui-dialog-body");
        const scrollables = dialog ? [...dialog.querySelectorAll("*")].filter((element) => element.scrollHeight > element.clientHeight && getComputedStyle(element).overflowY !== "visible") : [];
        return { headerInViewport: Boolean(header && header.top >= 0 && header.bottom <= innerHeight), footerInViewport: Boolean(footer && footer.top >= 0 && footer.bottom <= innerHeight), scrollableCount: scrollables.length, overflowX: body ? getComputedStyle(body).overflowX : null };
      });
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Dialog pendek" }).click();
      await page.keyboard.press("Escape");
      current.escapeClosed = await page.locator("[role=dialog]").count() === 0;
    }
    await page.close();
  }
}

const dialogPage = await browser.newPage({ viewport: { width: 375, height: 600 }, reducedMotion: "reduce" });
await dialogPage.goto(`${baseURL}/dev/ui`, { waitUntil: "networkidle" });
const dialogHeights = [];
for (const height of [600, 667, 800]) {
  await dialogPage.setViewportSize({ width: 375, height });
  await dialogPage.getByRole("button", { name: "Dialog panjang" }).click();
  await dialogPage.evaluate(() => document.querySelector(".ui-dialog-body")?.scrollTo(0, 10000));
  dialogHeights.push({ height, ...(await dialogPage.evaluate(() => { const dialog = document.querySelector("[role=dialog]"); const header = dialog?.querySelector(".ui-dialog-header")?.getBoundingClientRect(); const footer = dialog?.querySelector(".ui-dialog-footer")?.getBoundingClientRect(); return { headerInViewport: Boolean(header && header.top >= 0 && header.bottom <= innerHeight), footerInViewport: Boolean(footer && footer.top >= 0 && footer.bottom <= innerHeight), bodyOverflowX: getComputedStyle(dialog?.querySelector(".ui-dialog-body")).overflowX }; })) });
  await dialogPage.keyboard.press("Escape");
}
await dialogPage.close();
await browser.close();
if (server) server.kill();
await writeFile("qa/ui-results.json", JSON.stringify({ results, dialogHeights }, null, 2));
console.log(JSON.stringify({ results, dialogHeights }, null, 2));
