import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const baseURL = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const viewports = [
  { name: "375x667", width: 375, height: 667 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x800", width: 1024, height: 800 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1391x900", width: 1391, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 },
];
const routes = ["/", "/dev/fixtures"];
const results = [];
await mkdir("qa/screens", { recursive: true });
const browser = await chromium.launch({ headless: true });

async function collect(page, route, viewport) {
  const data = await page.evaluate(() => {
    const rect = (element) => element.getBoundingClientRect().toJSON();
    const overlap = (siblings) => { let tested = 0; let failed = 0; for (let i = 0; i < siblings.length; i += 1) for (let j = i + 1; j < siblings.length; j += 1) { tested += 1; const a = rect(siblings[i]); const b = rect(siblings[j]); if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) failed += 1; } return { tested, failed }; };
    const chipGroups = [...document.querySelectorAll(".chip-rail")].map((group) => overlap([...group.children]));
    const actionGroups = [...document.querySelectorAll(".tombstone-actions")].map((group) => overlap([...group.children]));
    const badgeGroups = [...document.querySelectorAll(".tombstone-badges")].map((group) => overlap([...group.children]));
    const menuGroups = [...document.querySelectorAll(".ui-menu")].map((group) => overlap([...group.querySelectorAll("[role=menuitem]")]));
    const textClips = [...document.querySelectorAll("body *")].filter((element) => { const style = getComputedStyle(element); return ["hidden", "clip", "clip-text"].includes(style.overflow) && !element.hasAttribute("data-truncate") && (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1); }).map((element) => ({ tag: element.tagName, className: String(element.className), scrollWidth: element.scrollWidth, clientWidth: element.clientWidth, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight }));
    const scrolling = document.scrollingElement;
    const overflow = [...document.querySelectorAll("body *")].filter((element) => !element.closest(".chip-rail") && rect(element).right > innerWidth + 1).map((element) => ({ tag: element.tagName, className: String(element.className), right: Math.round(rect(element).right) }));
    const buttons = [...document.querySelectorAll(".ui-button")].map((element) => ({ className: String(element.className), flexDirection: getComputedStyle(element).flexDirection, text: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor }));
    const avatar = [...document.querySelectorAll(".ui-avatar")].map((element) => ({ text: element.textContent?.trim(), className: String(element.className) }));
    const headline = document.querySelector(".hero-copy h1");
    const labelClips = [...document.querySelectorAll(".tombstone-label")].map((element) => ({ scrollHeight: element.scrollHeight, clientHeight: element.clientHeight }));
    return { overflow: { scrollWidth: scrolling?.scrollWidth ?? 0, clientWidth: scrolling?.clientWidth ?? 0, elements: overflow }, overlap: { chips: chipGroups, actions: actionGroups, badges: badgeGroups, menu: menuGroups }, textClips, buttons, avatar, headline: headline ? { lines: Math.round(rect(headline).height / parseFloat(getComputedStyle(headline).lineHeight), height: Math.round(rect(headline).height), width: Math.round(rect(headline).width), text: headline.textContent } : null, labelClips, scrollbar: { colorScheme: getComputedStyle(document.documentElement).colorScheme, color: getComputedStyle(document.documentElement).scrollbarColor } };
  });
  results.push({ route, viewport: viewport.name, ...data });
}

for (const viewport of viewports) {
  for (const route of routes) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: "reduce" });
    await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: `qa/screens/${route === "/" ? "home" : "fixtures"}-${viewport.name}.png`, fullPage: true });
    await collect(page, route, viewport);
    await page.close();
  }
}
await browser.close();
await writeFile("qa/ui-results.json", JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
