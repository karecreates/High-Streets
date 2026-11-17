/**
 * Copies the shopping-center map + tenant-logo directory from this browser
 * (Brandfetch allows the broker's Chrome; it blocks Playwright) and returns
 * a PNG the exporter embeds as the booklet map page.
 */

import { corridorMapPath } from "../utils/corridorPaths";
import { mountCaptureFrame } from "./captureFrame";
import { loadIframeToPng } from "./captureOverviewPage";
import {
  STREET_MAP_CAPTURE_HEIGHT,
  STREET_MAP_CAPTURE_WIDTH,
  waitForIframeSelector,
} from "./captureInteractiveStreetMap";

const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

export interface CenterMapPageCapture {
  png: string;
  mime: "image/png";
}

const READY_TIMEOUT_MS = 90_000;

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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not decode ${src}`));
    img.src = src;
  });
}

/** Keep logo alpha. Rasterize WebP/SVG so html-to-image cannot drop them. */
async function inlineImages(root: HTMLElement): Promise<void> {
  const imgs = [...root.querySelectorAll("img")];
  await Promise.all(
    imgs.map(async (img) => {
      img.removeAttribute("srcset");
      img.removeAttribute("sizes");
      const src = img.currentSrc || img.src;
      if (!src || src.startsWith("data:image/png") || src.startsWith("data:image/gif")) {
        return;
      }
      try {
        const response = await fetch(src, {
          signal: AbortSignal.timeout(5_000),
        });
        if (!response.ok) return;
        const blob = await response.blob();
        const type = blob.type || "";
        const needsRaster =
          type === "image/webp" ||
          type === "image/svg+xml" ||
          src.includes(".webp") ||
          src.includes(".svg");
        if (needsRaster) {
          const objectUrl = URL.createObjectURL(blob);
          try {
            const decoded = await loadImage(objectUrl);
            const canvas = document.createElement("canvas");
            canvas.width = decoded.naturalWidth;
            canvas.height = decoded.naturalHeight;
            canvas.getContext("2d")?.drawImage(decoded, 0, 0);
            img.src = canvas.toDataURL("image/png");
          } finally {
            URL.revokeObjectURL(objectUrl);
          }
        } else if (type.startsWith("image/")) {
          img.src = await blobToDataUrl(blob);
        } else {
          return;
        }
        img.removeAttribute("srcset");
        await img.decode().catch(() => undefined);
      } catch {
        /* iframe toPng can still read same-origin and blob srcs */
      }
    })
  );
}

async function waitForCenterMap(
  frame: HTMLIFrameElement,
  slug: string
): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < READY_TIMEOUT_MS) {
    const doc = frame.contentDocument;
    const grid = doc?.querySelector(".shopping-center-directory__grid");
    const cells = [...(grid?.children ?? [])] as HTMLElement[];
    const imgs = [
      ...(grid?.querySelectorAll("img") ?? []),
    ] as HTMLImageElement[];
    const painted = imgs.filter((img) => img.complete && img.naturalWidth > 8);
    const named = cells.filter((cell) =>
      cell.querySelector(".shopping-center-directory__name")
    );
    const readyFlag =
      doc?.documentElement.getAttribute("data-center-map-ready") === "1";
    if (
      readyFlag &&
      (cells.length === 0 || painted.length + named.length >= cells.length)
    ) {
      return;
    }
    await sleep(250);
  }
  throw new Error(`${slug} center directory did not finish painting logos.`);
}

export async function captureCenterMapPage(
  slug: string
): Promise<CenterMapPageCapture> {
  const frame = mountCaptureFrame(
    "Center map capture",
    STREET_MAP_CAPTURE_WIDTH,
    STREET_MAP_CAPTURE_HEIGHT
  );
  frame.src = `${corridorMapPath(slug)}?mode=pdf`;

  try {
    const doc = await waitForIframeSelector(
      frame,
      ".shopping-center-directory, .map-fullscreen",
      `${slug} center map failed to load.`
    );

    const style = doc.createElement("style");
    style.textContent = `
      .map-fullscreen__back,
      .map-fullscreen__controls-row,
      .static-mode-enter,
      .static-mode-exit,
      .street-view-dock,
      .gm-bundled-control,
      .gm-svpc,
      .gm-fullscreen-control,
      .gm-control-active { display: none !important; }
    `;
    doc.head.appendChild(style);

    await waitForCenterMap(frame, slug);
    await sleep(200);

    const liveDoc = frame.contentDocument ?? doc;
    const root = liveDoc.querySelector<HTMLElement>(".shopping-center-directory");
    if (!root) throw new Error(`${slug} tenant directory was missing.`);

    await inlineImages(root);
    await sleep(80);

    const capture = await loadIframeToPng(frame);
    const dataUrl = await Promise.race([
      capture(root, {
        width: STREET_MAP_CAPTURE_WIDTH,
        height: STREET_MAP_CAPTURE_HEIGHT,
        pixelRatio: 2,
        backgroundColor: "rgba(0,0,0,0)",
        cacheBust: false,
        skipAutoScale: true,
        skipFonts: true,
        imagePlaceholder: TRANSPARENT_PIXEL,
        onImageErrorHandler: () => TRANSPARENT_PIXEL,
      }),
      sleep(90_000).then(() => {
        throw new Error(`${slug} center map screenshot timed out.`);
      }),
    ]);
    const payload = dataUrl.split(",")[1];
    if (!payload) throw new Error(`${slug} center map screenshot was empty.`);

    return { png: payload, mime: "image/png" };
  } finally {
    frame.remove();
  }
}
