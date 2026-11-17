/**
 * Copies the dedicated corridor overview from this browser (Brandfetch allows
 * the broker's Chrome; it blocks Playwright) and returns a PNG the exporter
 * embeds as the booklet overview page — same idea as street-map overlays.
 *
 * The capture is the live dedicated page at booklet size, with only the
 * Back / Interactive Map buttons removed (`?mode=pdf`). No restyle.
 */

import { toPng } from "html-to-image";
import { corridorInfoPath } from "../utils/corridorPaths";
import { mountCaptureFrame } from "./captureFrame";
import {
  STREET_MAP_CAPTURE_HEIGHT,
  STREET_MAP_CAPTURE_WIDTH,
} from "./captureInteractiveStreetMap";

const IFRAME_TO_PNG_SRC = new URL("./iframeToPng.ts", import.meta.url).href;

export interface OverviewPageCapture {
  png: string;
  mime: "image/png";
}

const READY_TIMEOUT_MS = 90_000;
const EXPECTED_BRANDS = 10;
const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Keep logo alpha. Never flatten wordmarks through JPEG. */
async function inlineImages(root: HTMLElement): Promise<void> {
  const imgs = [...root.querySelectorAll("img")];
  await Promise.all(
    imgs.map(async (img) => {
      img.removeAttribute("srcset");
      img.removeAttribute("sizes");
      const src = img.currentSrc || img.src;
      if (!src || src.startsWith("data:")) return;
      try {
        const response = await fetch(src, {
          signal: AbortSignal.timeout(5_000),
        });
        if (!response.ok) return;
        const blob = await response.blob();
        if (!blob.type.startsWith("image/")) return;
        img.src = await blobToDataUrl(blob);
        img.removeAttribute("srcset");
        await img.decode().catch(() => undefined);
      } catch {
        /* iframe toPng can still read same-origin and blob srcs */
      }
    })
  );
}

function iframeDocument(frame: HTMLIFrameElement): Document | null {
  try {
    return frame.contentWindow?.document ?? frame.contentDocument;
  } catch {
    return null;
  }
}

function brandImages(doc: Document | null): HTMLImageElement[] {
  if (!doc) return [];
  return [...doc.querySelectorAll<HTMLImageElement>(".info-card--brands img")];
}

function isPainted(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 8;
}

function demographicsReady(doc: Document | null): boolean {
  if (!doc) return false;
  const view = doc.defaultView;
  const panel = doc.querySelector<HTMLElement>(".placer-tabpanel");
  if (!view || !panel) return false;
  const panelOpacity = Number.parseFloat(view.getComputedStyle(panel).opacity);
  const panelBox = panel.getBoundingClientRect();
  if (panelOpacity < 0.95 || panelBox.height < 80) return false;
  const values = [
    ...doc.querySelectorAll<HTMLElement>(
      ".placer-tabpanel__inner--demo .placer-stats__value"
    ),
  ];
  return values.some((el) => {
    const box = el.getBoundingClientRect();
    const opacity = Number.parseFloat(view.getComputedStyle(el).opacity);
    return (
      opacity > 0.95 &&
      box.height > 8 &&
      box.width > 8 &&
      (el.textContent ?? "").trim().length > 0
    );
  });
}

/**
 * Same ready-check as Abbot Kinney / Golden Triangle, but always re-read the
 * live iframe document. Holding the first `load` Document is how OTP reported
 * 0 logos while the page on screen already had them.
 */
async function waitForOverviewReady(
  frame: HTMLIFrameElement,
  slug: string
): Promise<Document> {
  const started = Date.now();
  while (Date.now() - started < READY_TIMEOUT_MS) {
    const doc = iframeDocument(frame);
    const path = frame.contentWindow?.location?.pathname ?? "";
    if (path.includes(slug) && doc?.querySelector(".street-page")) {
      injectOverviewCaptureStyles(doc);
      const brands = brandImages(doc).filter(isPainted).length;
      if (brands >= EXPECTED_BRANDS && demographicsReady(doc)) return doc;
    }
    await sleep(250);
  }

  const doc = iframeDocument(frame);
  const ready = brandImages(doc).filter(isPainted).length;
  if (doc?.querySelector(".street-page") && ready > 0 && demographicsReady(doc)) {
    return doc;
  }
  if (ready > 0) {
    throw new Error(`${slug} demographics were not visible on the overview.`);
  }

  throw new Error(
    `Selective Brands only loaded ${ready} of ${EXPECTED_BRANDS} logos.`
  );
}

const OVERVIEW_CAPTURE_CSS = `
  .street-detail__actions {
    display: none !important;
  }
  .placer-tabpanel,
  .placer-tabpanel * {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  .brand-grid__cell,
  .brand-grid__cell img {
    opacity: 1 !important;
    visibility: visible !important;
    animation: none !important;
    background: transparent !important;
    box-shadow: none !important;
  }
  .info-card__metric-value,
  .info-card__metric-label,
  .traffic-card__title,
  .traffic-card__list li span,
  .traffic-card__list li strong,
  .placer-card__header > span:first-child,
  .placer-tabs__tab,
  .placer-stats--featured .placer-stats__label,
  .placer-stats--featured .placer-stats__value {
    white-space: nowrap !important;
    word-break: normal !important;
    overflow-wrap: normal !important;
  }
  .placer-tabpanel__inner--demo > .placer-stats--secondary .placer-stats__label {
    display: block !important;
    height: 1.25em !important;
    line-height: 1.25 !important;
    overflow: visible !important;
    white-space: nowrap !important;
    word-break: normal !important;
    overflow-wrap: normal !important;
  }
  html, body, .street-page, .street-page * {
    scrollbar-width: none !important;
  }
  .street-page *::-webkit-scrollbar {
    width: 0 !important;
    height: 0 !important;
    display: none !important;
  }
`;

function injectOverviewCaptureStyles(doc: Document): void {
  if (doc.getElementById("overview-capture-style")) return;
  const style = doc.createElement("style");
  style.id = "overview-capture-style";
  style.textContent = OVERVIEW_CAPTURE_CSS;
  doc.head.appendChild(style);
}

export async function loadIframeToPng(
  frame: HTMLIFrameElement
): Promise<typeof toPng> {
  const win = frame.contentWindow;
  const doc = iframeDocument(frame);
  if (!win || !doc) throw new Error("The overview frame was missing.");
  if (typeof win.__IFRAME_TO_PNG__ === "function") return win.__IFRAME_TO_PNG__;

  await new Promise<void>((resolve, reject) => {
    const script = doc.createElement("script");
    script.type = "module";
    script.src = IFRAME_TO_PNG_SRC;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Could not load the overview screenshot helper.")),
      { once: true }
    );
    doc.head.appendChild(script);
  });

  const started = Date.now();
  while (Date.now() - started < 3_000) {
    if (typeof win.__IFRAME_TO_PNG__ === "function") return win.__IFRAME_TO_PNG__;
    await sleep(25);
  }
  throw new Error("The overview screenshot helper did not start.");
}

/**
 * html-to-image clones into an SVG foreignObject and often drops stylesheet
 * strokes / dashoffset. Copy computed presentation onto attributes, then
 * swap each ring SVG for a PNG so the thin stroke survives the capture.
 */
async function bakeScoreRings(doc: Document): Promise<void> {
  const win = doc.defaultView;
  if (!win) return;

  for (const svg of [...doc.querySelectorAll<SVGSVGElement>(".score-ring__svg")]) {
    for (const el of svg.querySelectorAll<SVGElement>("*")) {
      const cs = win.getComputedStyle(el);
      if (cs.stroke && cs.stroke !== "none") {
        el.setAttribute("stroke", cs.stroke);
      }
      const strokeWidth = cs.strokeWidth;
      if (strokeWidth && strokeWidth !== "none") {
        el.setAttribute("stroke-width", strokeWidth);
      }
      if (cs.fill === "none" || cs.fill) {
        el.setAttribute("fill", cs.fill === "none" ? "none" : cs.fill);
      }
      if (cs.strokeLinecap && cs.strokeLinecap !== "butt") {
        el.setAttribute("stroke-linecap", cs.strokeLinecap);
      }
      const { strokeDasharray, strokeDashoffset } = el.style;
      if (strokeDasharray) el.setAttribute("stroke-dasharray", strokeDasharray);
      if (strokeDashoffset) {
        el.setAttribute("stroke-dashoffset", strokeDashoffset);
      }
    }

    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const rect = svg.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      svg.setAttribute("width", String(rect.width));
      svg.setAttribute("height", String(rect.height));
    }

    const xml = new XMLSerializer().serializeToString(svg);
    const img = new win.Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
    await img.decode().catch(() => undefined);

    const canvas = doc.createElement("canvas");
    const dpr = 2;
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.drawImage(img, 0, 0, width, height);
    }
    const baked = doc.createElement("img");
    baked.className = "score-ring__svg";
    baked.alt = "";
    baked.src = canvas.toDataURL("image/png");
    baked.style.width = `${width}px`;
    baked.style.height = `${height}px`;
    baked.style.display = "block";
    baked.style.background = "transparent";
    svg.replaceWith(baked);
  }
}

export async function captureOverviewPage(
  slug: string
): Promise<OverviewPageCapture> {
  const frame = mountCaptureFrame(
    "Overview page capture",
    STREET_MAP_CAPTURE_WIDTH,
    STREET_MAP_CAPTURE_HEIGHT
  );
  frame.src = `${corridorInfoPath(slug)}?mode=pdf`;

  try {
    const doc = await waitForOverviewReady(frame, slug);
    const root = doc.querySelector<HTMLElement>(".street-page");
    if (!root) throw new Error(`${slug} overview frame was missing.`);

    await inlineImages(root);
    await bakeScoreRings(doc);
    await sleep(80);

    const capture = await loadIframeToPng(frame);
    const dataUrl = await Promise.race([
      capture(root, {
        width: STREET_MAP_CAPTURE_WIDTH,
        height: STREET_MAP_CAPTURE_HEIGHT,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: false,
        skipAutoScale: true,
        skipFonts: true,
        imagePlaceholder: TRANSPARENT_PIXEL,
        onImageErrorHandler: () => TRANSPARENT_PIXEL,
      }),
      sleep(90_000).then(() => {
        throw new Error(`${slug} overview screenshot timed out.`);
      }),
    ]);
    const payload = dataUrl.split(",")[1];
    if (!payload) throw new Error(`${slug} overview screenshot was empty.`);

    return { png: payload, mime: "image/png" };
  } finally {
    frame.remove();
  }
}
