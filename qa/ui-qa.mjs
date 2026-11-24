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
const routes = ["/", "/profile", "/dev/fixtures"];
const results = [];
await mkdir("qa/screens", { recursive: true });
const browser = await chromium.launch({ headless: true });

async function openPage(viewport) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: "reduce" });
  const issues = [];
  page.on("console", (message) => { if (message.type() === "error") issues.push(message.text()); });
  page.on("pageerror", (error) => issues.push(`pageerror: ${error.message}`));
  return { page, issues };
}

async function collect(page, route, viewport, issues = []) {
  const data = await page.evaluate(() => {
    const rect = (element) => element.getBoundingClientRect().toJSON();
    const overlap = (siblings) => { let tested = 0; let failed = 0; for (let i = 0; i < siblings.length; i += 1) for (let j = i + 1; j < siblings.length; j += 1) { tested += 1; const a = rect(siblings[i]); const b = rect(siblings[j]); if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) failed += 1; } return { tested, failed }; };
    const chipGroups = [...document.querySelectorAll(".chip-rail")].map((group) => overlap([...group.children]));
    const actionGroups = [...document.querySelectorAll(".tombstone-actions")].map((group) => overlap([...group.children]));
    const badgeGroups = [...document.querySelectorAll(".tombstone-badges")].map((group) => overlap([...group.children]));
    const menuGroups = [...document.querySelectorAll(".ui-menu")].map((group) => overlap([...group.querySelectorAll("[role=menuitem]")]));
    const managementGroups = [...document.querySelectorAll(".my-grave-actions, .profile-filters, .checkout-method-grid, .theme-swatches, .story-template-grid, .checkout-benefits")].map((group) => overlap([...group.children]));
    const textClips = [...document.querySelectorAll("body *")].filter((element) => { const style = getComputedStyle(element); return ["hidden", "clip", "clip-text"].includes(style.overflow) && !element.hasAttribute("data-truncate") && !element.classList.contains("sr-only") && (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1); }).map((element) => ({ tag: element.tagName, className: String(element.className), scrollWidth: element.scrollWidth, clientWidth: element.clientWidth, scrollHeight: element.scrollHeight, clientHeight: element.clientHeight }));
    const scrolling = document.scrollingElement;
    const overflow = [...document.querySelectorAll("body *")].filter((element) => !element.closest(".chip-rail") && rect(element).right > innerWidth + 1).map((element) => ({ tag: element.tagName, className: String(element.className), right: Math.round(rect(element).right) }));
    const buttons = [...document.querySelectorAll(".ui-button")].map((element) => ({ className: String(element.className), flexDirection: getComputedStyle(element).flexDirection, text: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor }));
    const avatar = [...document.querySelectorAll(".ui-avatar")].map((element) => ({ text: element.textContent?.trim(), className: String(element.className) }));
    const headline = document.querySelector(".hero-copy h1");
    const labelClips = [...document.querySelectorAll(".tombstone-label")].map((element) => ({ scrollHeight: element.scrollHeight, clientHeight: element.clientHeight }));
    return { overflow: { scrollWidth: scrolling?.scrollWidth ?? 0, clientWidth: scrolling?.clientWidth ?? 0, elements: overflow }, overlap: { chips: chipGroups, actions: actionGroups, badges: badgeGroups, menu: menuGroups, management: managementGroups }, textClips, buttons, avatar, headline: headline ? { lines: Math.round(rect(headline).height / parseFloat(getComputedStyle(headline).lineHeight)), height: Math.round(rect(headline).height), width: Math.round(rect(headline).width), text: headline.textContent } : null, labelClips, scrollbar: { colorScheme: getComputedStyle(document.documentElement).colorScheme, color: getComputedStyle(document.documentElement).scrollbarColor } };
  });
  results.push({ route, viewport: viewport.name, ...data, consoleIssues: issues });
}

for (const viewport of viewports) {
  for (const route of routes) {
    const { page, issues } = await openPage(viewport);
    await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: `qa/screens/${route === "/" ? "home" : route === "/profile" ? "profile" : "fixtures"}-${viewport.name}.png`, fullPage: true });
    await collect(page, route, viewport, issues);
    await page.close();
  }
}
const fixtureScenarios = [
  { name: "bury", button: "Kuburkan wacana" },
  { name: "grave", button: "Detail makam" },
  { name: "story", button: "Story Studio" },
  { name: "checkout", button: "Checkout VIP" },
];
for (const viewport of viewports) {
  for (const scenario of fixtureScenarios) {
    const { page, issues } = await openPage(viewport);
    await page.goto(`${baseURL}/dev/fixtures`, { waitUntil: "networkidle" });
    await page.keyboard.press("Escape");
    await page.locator("section.ui-preview-surface").getByRole("button", { name: scenario.button, exact: true }).click();
    await page.waitForTimeout(350);
    await page.screenshot({ path: `qa/screens/fixtures-${scenario.name}-${viewport.name}.png`, fullPage: true });
    await collect(page, `/dev/fixtures#${scenario.name}`, viewport, issues);
    await page.close();
  }
}
await browser.close();
await writeFile("qa/ui-results.json", JSON.stringify(results, null, 2));
const failures = results.filter((entry) => entry.overflow.scrollWidth > entry.overflow.clientWidth + 1 || entry.overflow.elements.length || entry.textClips.length || entry.labelClips.some((clip) => clip.scrollHeight > clip.clientHeight + 1) || Object.values(entry.overlap).flat().some((group) => group.failed) || entry.consoleIssues.length);
console.log(JSON.stringify({ runs: results.length, failures: failures.length, failedRuns: failures.map(({ route, viewport, overflow, textClips, labelClips, overlap, consoleIssues }) => ({ route, viewport, overflow, textClips, labelClips, overlap, consoleIssues })) }, null, 2));
if (failures.length) process.exitCode = 1;
