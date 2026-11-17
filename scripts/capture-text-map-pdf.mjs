/**
 * One-off: text-only Third Street Promenade map, framed like the
 * Wilshire-to-Colorado screenshot, saved as a 16:9 PDF.
 */
import fs from "node:fs/promises";
import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";

const BASE = "http://localhost:5173";
const OUT_PDF = new URL(
  "../Third-Street-Promenade-Text-Map.pdf",
  import.meta.url
);
const OUT_PNG = new URL("../tmp/third-street-text-map.png", import.meta.url);

const VIEWPORT = { width: 1600, height: 900 };
/** Tuned so Wilshire sits near the top and Colorado near the bottom. */
const CAMERA = { lat: 34.01515, lng: -118.49585, zoom: 17.28 };

const WEBGL_ARGS = [
  "--use-gl=angle",
  "--use-angle=default",
  "--ignore-gpu-blocklist",
  "--enable-gpu-rasterization",
  "--enable-unsafe-swiftshader",
];

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: WEBGL_ARGS,
});
const page = await browser.newPage({
  viewport: VIEWPORT,
  deviceScaleFactor: 2,
});
await page.addInitScript(() => {
  sessionStorage.setItem("high-streets-access", "1");
});
await page.goto(`${BASE}/street/third-street-promenade/map?v=textpdf`, {
  waitUntil: "domcontentloaded",
});
await page.locator(".map-fullscreen").waitFor({ timeout: 30_000 });
await page.waitForFunction(
  () => [...document.querySelectorAll("[title]")].some((el) => /lululemon/i.test(el.getAttribute("title") || "")),
  undefined,
  { timeout: 45_000 }
);

await page.getByRole("button", { name: "Text Only" }).click();
await page.waitForFunction(
  () => {
    const titles = [...document.querySelectorAll("[title]")].map((el) => el.getAttribute("title") || "");
    return titles.some((title) => /John Reed/i.test(title)) && titles.some((title) => /Google Store/i.test(title));
  },
  undefined,
  { timeout: 45_000 }
);
// MapFocus locks text-only zoom at 18.15. Let that settle, then frame the sheet.
await page.waitForTimeout(5000);

const applied = await page.evaluate((camera) => {
  const root = document.querySelector("#root");
  const key = Object.keys(root).find(
    (k) => k.startsWith("__reactContainer") || k.startsWith("__reactFiber")
  );
  const seen = new Set();
  const stack = [root[key]];
  let map = null;
  while (stack.length) {
    const fiber = stack.pop();
    if (!fiber || seen.has(fiber)) continue;
    seen.add(fiber);
    let state = fiber.memoizedState;
    for (let guard = 0; state && guard < 40; guard += 1) {
      const value = state.memoizedState;
      if (value && typeof value.getZoom === "function" && typeof value.panTo === "function") {
        map = value;
      }
      state = state.next;
    }
    if (fiber.child) stack.push(fiber.child);
    if (fiber.sibling) stack.push(fiber.sibling);
  }
  if (!map) return { ok: false };
  map.setTilt(0);
  map.setHeading(0);
  map.setZoom(camera.zoom);
  map.panTo({ lat: camera.lat, lng: camera.lng });
  return { ok: true, zoom: map.getZoom() };
}, CAMERA);
if (!applied.ok) throw new Error("Could not reach the map camera");

await page.waitForTimeout(2500);
await page.addStyleTag({
  content: `
    .map-fullscreen__back,
    .map-fullscreen__controls-row,
    .major-tenants-toggle,
    .static-mode-enter,
    .static-mode-exit,
    .map-type-toggle,
    .street-view-dock,
    .gm-bundled-control,
    .gm-svpc,
    .gm-fullscreen-control,
    .gmnoprint { display: none !important; }
  `,
});
await page.waitForTimeout(400);

const live = await page.evaluate(() => {
  const root = document.querySelector("#root");
  const key = Object.keys(root).find(
    (k) => k.startsWith("__reactContainer") || k.startsWith("__reactFiber")
  );
  const seen = new Set();
  const stack = [root[key]];
  let zoom = null;
  let center = null;
  while (stack.length) {
    const fiber = stack.pop();
    if (!fiber || seen.has(fiber)) continue;
    seen.add(fiber);
    let state = fiber.memoizedState;
    for (let guard = 0; state && guard < 40; guard += 1) {
      const value = state.memoizedState;
      if (value && typeof value.getCenter === "function") {
        const c = value.getCenter();
        center = { lat: c.lat(), lng: c.lng() };
        zoom = value.getZoom();
      }
      state = state.next;
    }
    if (fiber.child) stack.push(fiber.child);
    if (fiber.sibling) stack.push(fiber.sibling);
  }
  const titles = [...document.querySelectorAll("[title]")]
    .map((el) => el.getAttribute("title") || "")
    .filter((title) => title && !/keyboard|google maps|zoom|pegman/i.test(title));
  return { zoom, center, labels: titles.length };
});
console.log("camera", live);

const png = await page.screenshot({ type: "png" });
await fs.mkdir(new URL("../tmp/", import.meta.url), { recursive: true });
await fs.writeFile(OUT_PNG, png);

const pdf = await PDFDocument.create();
const image = await pdf.embedPng(png);
const pageWidth = 1224;
const pageHeight = Math.round((1224 * VIEWPORT.height) / VIEWPORT.width);
const sheet = pdf.addPage([pageWidth, pageHeight]);
sheet.drawImage(image, { x: 0, y: 0, width: pageWidth, height: pageHeight });
await fs.writeFile(OUT_PDF, await pdf.save());
console.log("wrote", OUT_PDF.pathname, "page", pageWidth, pageHeight);
await browser.close();
