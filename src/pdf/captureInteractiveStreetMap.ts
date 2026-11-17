/**
 * Reads the Interactive Map in this browser (same logo cache the broker
 * already has) and returns the plotted marker images + positions.
 * Google Maps tiles cannot be exported from a canvas (CORS). The booklet
 * stamps these markers onto a Playwright basemap instead.
 */

import { corridorMapPath } from "../utils/corridorPaths";
import { mountCaptureFrame } from "./captureFrame";

/** Match the 17 × 11in booklet page so maps fill edge-to-edge. */
export const STREET_MAP_CAPTURE_WIDTH = 1632;
export const STREET_MAP_CAPTURE_HEIGHT = 1056;

export interface StreetMapMarkerOverlay {
  png: string;
  mime: "image/png" | "image/jpeg";
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface StreetMapOverlay {
  width: number;
  height: number;
  markers: StreetMapMarkerOverlay[];
}

const READY_TIMEOUT_MS = 90_000;

const CONTROL_TITLE =
  /keyboard shortcuts|fullscreen|map camera|move |zoom |open this area|google maps/i;

/** Distinctive pins that mean the curated Major Tenants set is on the map. */
const READY_TITLES: Record<string, RegExp[]> = {
  "abbot-kinney": [/J Crew/i, /Everlane/i],
  "golden-triangle": [/Louis Vuitton/i, /Chanel/i],
  "third-street-promenade": [/Lululemon/i, /Alo Yoga/i],
  "old-town-pasadena": [/Apple/i, /TESLA/i, /One Colorado/i],
  "one-colorado": [/Apple/i, /TESLA/i],
  "the-paseo": [/The Paseo/i],
  melrose: [/The Row/i, /Bottega Veneta/i, /Reebok/i],
  "la-brea": [/Arc'teryx/i, /Carhartt/i],
  larchmont: [/Aesop/i, /Diptyque/i],
  montana: [/Warby Parker/i, /Williams-Sonoma/i],
  robertson: [/Blue Bottle/i, /James Perse/i],
  "silver-lake": [/Madewell/i, /Le Labo/i],
  "studio-city": [/Lululemon/i, /Sephora/i],
  "la-arts-district": [/Blue Bottle/i, /Le Labo/i],
  "downtown-la": [/Zara/i, /Sephora/i],
  "culver-city": [/Joe & The Juice/i, /In-N-Out/i],
  "downtown-manhattan-beach": [/Vuori/i, /Free People/i],
  "sunset-strip": [/SKIMS/i, /Oliver Peoples/i],
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * The iframe's first `load` is often `about:blank`. Always re-read
 * `contentDocument` until the live app actually mounted.
 */
export async function waitForIframeSelector(
  frame: HTMLIFrameElement,
  selector: string,
  errorMessage: string,
  timeoutMs = 30_000
): Promise<Document> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const doc = frame.contentDocument;
    if (doc?.querySelector(selector)) return doc;
    await sleep(100);
  }
  throw new Error(errorMessage);
}

function hideMapChrome(doc: Document): void {
  doc.querySelector(".map-fullscreen")?.classList.add("map-fullscreen--static");
  doc.documentElement.classList.add("pdf-map-capture");
  const style = doc.createElement("style");
  style.textContent = `
    .map-fullscreen__back,
    .map-fullscreen__controls-row,
    .major-tenants-toggle,
    .static-mode-enter,
    .static-mode-exit,
    .map-print-btn,
    .map-type-toggle,
    .street-view-dock,
    .gm-bundled-control,
    .gm-svpc,
    .gm-fullscreen-control,
    .gm-control-active,
    .shopping-center-directory { display: none !important; }
  `;
  doc.head.appendChild(style);
}

async function enterStaticMode(doc: Document): Promise<void> {
  const enter = doc.querySelector<HTMLButtonElement>(".static-mode-enter");
  enter?.click();
  await sleep(500);
  hideMapChrome(doc);
}

function nudgeMapOut(doc: Document): void {
  const target =
    doc.querySelector(".map-canvas") ?? doc.querySelector(".gm-style");
  if (!target) return;
  target.dispatchEvent(
    new WheelEvent("wheel", {
      deltaY: 160,
      bubbles: true,
      cancelable: true,
      view: doc.defaultView ?? undefined,
    })
  );
}

function waitForMarkers(doc: Document, slug: string): Promise<void> {
  const started = Date.now();
  const patterns = READY_TITLES[slug];
  const fallbackAt = 20_000;
  return new Promise((resolve, reject) => {
    const tick = () => {
      const titles = [...doc.querySelectorAll("[title]")].map(
        (el) => el.getAttribute("title") || ""
      );
      const tenantTitles = titles.filter(
        (title) => title && !CONTROL_TITLE.test(title)
      );
      const matched = patterns
        ? patterns.every((pattern) =>
            titles.some((title) => pattern.test(title))
          )
        : tenantTitles.length >= 5;
      const elapsed = Date.now() - started;
      if (matched || (elapsed >= fallbackAt && tenantTitles.length >= 3)) {
        resolve();
        return;
      }
      if (elapsed > READY_TIMEOUT_MS) {
        reject(new Error(`${slug} map did not finish plotting.`));
        return;
      }
      window.setTimeout(tick, 250);
    };
    tick();
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function parseRasterDataUrl(
  src: string
): { mime: "image/png" | "image/jpeg"; data: string } | null {
  const match =
    /^data:(image\/(?:png|jpeg|jpg));base64,([A-Za-z0-9+/=\s]+)$/i.exec(src);
  if (!match) return null;
  const mime =
    match[1].toLowerCase() === "image/jpg" ||
    match[1].toLowerCase() === "image/jpeg"
      ? "image/jpeg"
      : "image/png";
  return { mime, data: match[2].replace(/\s/g, "") };
}

async function rasterFromSrc(
  src: string
): Promise<{ mime: "image/png" | "image/jpeg"; data: string } | null> {
  const fromData = parseRasterDataUrl(src);
  if (fromData) return fromData;
  if (!src.startsWith("blob:")) return null;
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) return null;
    return parseRasterDataUrl(await blobToDataUrl(blob));
  } catch {
    return null;
  }
}

async function countPaintedLogos(root: HTMLElement): Promise<number> {
  let count = 0;
  for (const img of root.querySelectorAll("img")) {
    const src = img.currentSrc || img.src;
    if (!src.startsWith("data:image/")) continue;
    const box = img.getBoundingClientRect();
    if (box.width >= 16 && box.height >= 16) count += 1;
  }
  return count;
}

/**
 * Titles appear before the canvas wordmarks. Wait until the painted set
 * stops growing so a fast capture cannot stamp a single placeholder.
 */
async function waitForPaintedLogos(
  root: HTMLElement,
  slug: string
): Promise<void> {
  const minimum = Math.max(READY_TITLES[slug]?.length ?? 5, 5);
  const started = Date.now();
  let last = 0;
  let stableTicks = 0;
  while (Date.now() - started < READY_TIMEOUT_MS) {
    const count = await countPaintedLogos(root);
    if (count >= minimum && count === last) {
      stableTicks += 1;
      if (stableTicks >= 6) return;
    } else {
      stableTicks = 0;
    }
    last = count;
    await sleep(250);
  }
  if (last >= minimum) return;
  throw new Error(`${slug} map only painted ${last} logos.`);
}

async function collectMarkerOverlays(
  root: HTMLElement
): Promise<StreetMapMarkerOverlay[]> {
  const origin = root.getBoundingClientRect();
  const overlays: StreetMapMarkerOverlay[] = [];
  const seen = new Set<string>();
  for (const img of root.querySelectorAll("img")) {
    const parsed = await rasterFromSrc(img.currentSrc || img.src);
    if (!parsed) continue;
    const box = img.getBoundingClientRect();
    if (box.width < 16 || box.height < 16) continue;
    const x = box.left - origin.left;
    const y = box.top - origin.top;
    const key = `${Math.round(x)}:${Math.round(y)}:${Math.round(box.width)}:${Math.round(box.height)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    overlays.push({
      png: parsed.data,
      mime: parsed.mime,
      x,
      y,
      w: box.width,
      h: box.height,
    });
  }
  return overlays;
}

function markerHasPaintedLogo(doc: Document, name: RegExp): boolean {
  return [...doc.querySelectorAll("[title]")].some((el) => {
    if (!name.test(el.getAttribute("title") || "")) return false;
    const img =
      el instanceof HTMLImageElement ? el : el.querySelector("img");
    if (!img) return false;
    const box = img.getBoundingClientRect();
    return box.width >= 24 && box.height >= 16;
  });
}

async function waitForNamedLogo(
  doc: Document,
  name: RegExp,
  timeoutMs = 20_000
): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (markerHasPaintedLogo(doc, name)) return;
    await sleep(200);
  }
}

export async function captureInteractiveStreetMap(
  slug: string
): Promise<StreetMapOverlay> {
  const frame = mountCaptureFrame(
    "Booklet map capture",
    STREET_MAP_CAPTURE_WIDTH,
    STREET_MAP_CAPTURE_HEIGHT,
    "map"
  );
  const mapPath = corridorMapPath(slug);
  // Match Playwright's /map?mode=pdf camera so stamped logos sit on the
  // same locked framing as the booklet screenshot.
  frame.src =
    slug === "abbot-kinney" || slug === "third-street-promenade"
      ? `${mapPath}?mode=pdf`
      : mapPath;

  try {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(
        () => reject(new Error(`${slug} map failed to load.`)),
        30_000
      );
      frame.addEventListener(
        "load",
        () => {
          window.clearTimeout(timer);
          resolve();
        },
        { once: true }
      );
    });

    const doc = frame.contentDocument;
    if (!doc) throw new Error("Could not read the Interactive Map.");

    await waitForMarkers(doc, slug);
    await sleep(4_000);
    await enterStaticMode(doc);
    if (slug !== "abbot-kinney" && slug !== "third-street-promenade") {
      nudgeMapOut(doc);
    }
    await waitForMarkers(doc, slug);
    if (slug === "old-town-pasadena") {
      await waitForNamedLogo(doc, /One Colorado/i);
    }
    await sleep(400);

    const root = doc.querySelector<HTMLElement>(".map-fullscreen");
    if (!root) throw new Error(`${slug} map frame was missing.`);

    await waitForPaintedLogos(root, slug);
    const markers = await collectMarkerOverlays(root);
    if (!markers.length) {
      throw new Error("No tenant logos were ready to copy from the map.");
    }

    const box = root.getBoundingClientRect();
    return {
      width: Math.round(box.width) || STREET_MAP_CAPTURE_WIDTH,
      height: Math.round(box.height) || STREET_MAP_CAPTURE_HEIGHT,
      markers,
    };
  } finally {
    frame.remove();
  }
}
