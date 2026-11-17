/**
 * High Streets booklet exporter.
 *
 * Drives the app's own /playbook route in headless Chromium and assembles one
 * US Letter landscape PDF. Text pages are printed by Chromium so type stays
 * vector; map pages are captured at 300 DPI because Chromium's PDF pipeline
 * drops the Google Maps canvas.
 *
 * Usage: node scripts/export-booklet.mjs --slugs abbot-kinney,montana [--out file.pdf]
 */

import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";

/** Tabloid landscape 17 × 11in at 96 CSS dpi. */
export const PAGE_WIDTH_PX = 1632;
export const PAGE_HEIGHT_PX = 1056;
/** 17in x 11in in PDF points (72 per inch). */
const PAGE_WIDTH_PT = 1224;
const PAGE_HEIGHT_PT = 792;
/** 300 DPI / 96 CSS dpi — yields 3300 x 2550 px map captures. */
const RASTER_SCALE = 300 / 96;

const DEFAULT_BASE_URL = "http://localhost:5173";
const DEFAULT_OUT_FILE = "High-Streets-Booklet.pdf";
const ACCESS_SESSION_KEY = "high-streets-access";
/**
 * Google Maps renders vector tiles through WebGL. Headless Chromium has no GPU,
 * so without a software rasteriser it silently falls back to the raster map —
 * which loses the app's styling and resets the camera mid-fit.
 */
export const WEBGL_ARGS = [
  // Google Maps refuses vector rendering on a software rasteriser, so ask ANGLE
  // for the real GPU and fall back to SwiftShader if that is unavailable.
  "--use-gl=angle",
  "--use-angle=default",
  "--ignore-gpu-blocklist",
  "--enable-gpu-rasterization",
  "--enable-unsafe-swiftshader",
];
/** Logo loads are queued and retried against a rate-limited CDN. */
const READY_TIMEOUT_MS = 180_000;
const SOFT_NAV_TIMEOUT_MS = 4_000;

export function playbookUrl(baseUrl, slugs, pageIndex) {
  const params = new URLSearchParams({
    slugs: slugs.join(","),
    page: String(pageIndex),
  });
  return `${baseUrl.replace(/\/$/, "")}/playbook?${params}`;
}

/**
 * High-street maps must be captured from the real Interactive Map route.
 * The playbook clone restyles the camera and restacks logos.
 */
/** Capture the Interactive Map at the booklet page size so it fills 17 × 11. */
export const STREET_MAP_VIEWPORT = { width: 1632, height: 1056 };
/**
 * Capture at the booklet page size (17 × 11in) so the map fills the sheet
 * with no letterbox bars.
 */
const INTERACTIVE_STREET_VIEWPORT = {
  width: PAGE_WIDTH_PX,
  height: PAGE_HEIGHT_PX,
};
const CONTROL_TITLE =
  /keyboard shortcuts|fullscreen|map camera|move |zoom |open this area|google maps/i;
const STREET_MAP_READY_TITLES = {
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
  "downtown-la": [/FIGat7th/i, /Aesop/i],
  "culver-city": [/Joe & The Juice/i, /In-N-Out/i],
  "downtown-manhattan-beach": [/Vuori/i, /Free People/i],
  "sunset-strip": [/SKIMS/i, /Oliver Peoples/i],
};

export function streetMapCaptureUrl(baseUrl, slug) {
  return `${baseUrl.replace(/\/$/, "")}/street/${slug}/map?mode=pdf`;
}

export function isStreetMapCapture(spec) {
  return spec.kind === "location-map" && spec.locationType === "high-street";
}

export function isOverviewCapture(spec) {
  return spec.kind === "overview";
}

export function isCenterMapCapture(spec) {
  return spec.kind === "location-map" && spec.locationType === "shopping-center";
}

function leftInteractiveMap(spec) {
  return isStreetMapCapture(spec);
}

async function exitFullscreen(page) {
  await page.evaluate(() => {
    if (document.fullscreenElement) {
      return document.exitFullscreen().catch(() => undefined);
    }
    return undefined;
  });
}

async function setPageViewport(page, size) {
  await exitFullscreen(page);
  await page.setViewportSize(size);
}

export async function gotoStreetMapCapture(page, baseUrl, slug) {
  await setPageViewport(page, INTERACTIVE_STREET_VIEWPORT);
  await page.goto(streetMapCaptureUrl(baseUrl, slug), {
    waitUntil: "domcontentloaded",
  });
}

export async function installBrandfetchRetries(context) {
  await context.route("**/cdn.brandfetch.io/**", async (route) => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const response = await route.fetch();
        if (response.status() !== 429 && response.status() < 500) {
          await route.fulfill({ response });
          return;
        }
      } catch {
        /* retry */
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    }
    await route.continue();
  });
}

export async function restorePlaybookViewport(page) {
  await setPageViewport(page, {
    width: PAGE_WIDTH_PX,
    height: PAGE_HEIGHT_PX,
  });
}

function collectMarkerTitles(ignoreSource) {
  const ignore = new RegExp(ignoreSource, "i");
  return [...document.querySelectorAll("[title]")]
    .map((el) => el.getAttribute("title") || "")
    .filter((title) => title && !ignore.test(title));
}

async function waitForInteractiveStreetCapture(page, slug) {
  const empty = page.locator(".street-page--empty");
  const frame = page.locator(".map-fullscreen");
  try {
    await frame.or(empty).first().waitFor({ timeout: 30_000 });
  } catch (error) {
    throw new Error(
      `${slug} map failed to load. ${
        error instanceof Error ? error.message : error
      }`
    );
  }
  if (await empty.count()) {
    throw new Error(`${slug} map is not available.`);
  }

  try {
    await page.waitForFunction(
      () => document.documentElement.getAttribute("data-pdf-ready") === "true",
      undefined,
      { timeout: 45_000 }
    );
  } catch {
    const titles = await page.evaluate(
      collectMarkerTitles,
      CONTROL_TITLE.source
    );
    const waiting = await page.evaluate(() =>
      document.documentElement.getAttribute("data-pdf-waiting")
    );
    if (titles.length < 3 && !(await page.locator(".gm-style").count())) {
      throw new Error(
        `${slug} map did not finish plotting${
          waiting ? ` (waiting: ${waiting})` : ""
        }.`
      );
    }
  }

  await exitFullscreen(page);
  await page.evaluate(() => {
    const mapFrame = document.querySelector(".map-fullscreen");
    mapFrame?.classList.add("map-fullscreen--static");
    document.documentElement.classList.add("pdf-map-capture");
  });
  await page.addStyleTag({
    content: `
      .map-fullscreen__back,
      .map-fullscreen__controls-row,
      .major-tenants-toggle,
      .static-mode-enter,
      .static-mode-exit,
      .map-type-toggle,
      .street-view-dock,
      .shopping-center-directory { display: none !important; }
    `,
  });
  await page.waitForTimeout(800);
}

export async function waitForStreetMapReady(page, slug) {
  await waitForInteractiveStreetCapture(page, slug);
}

/** Waits for the page manifest the playbook route publishes on `window`. */
export async function readPlaybookManifest(page) {
  try {
    await page.waitForFunction(
      () => Boolean(window.__PLAYBOOK__?.pages?.length),
      undefined,
      { timeout: 20_000 }
    );
  } catch {
    const failure = await page.evaluate(() =>
      document.documentElement.getAttribute("data-pdf-error")
    );
    if (failure) throw new Error(failure);
    return null;
  }
  return page.evaluate(() => window.__PLAYBOOK__ ?? null);
}

/**
 * Waits for the app's own readiness signal for the expected page.
 * Throws on `data-pdf-error` so a broken page never ships silently.
 */
export async function waitForPageReady(page, spec) {
  try {
    await page.waitForFunction(
      (expectedIndex) => {
        const root = document.documentElement;
        const error = root.getAttribute("data-pdf-error");
        if (error) return { error };

        const mounted = document.querySelector("[data-page-index]");
        if (!mounted) return false;
        if (Number(mounted.getAttribute("data-page-index")) !== expectedIndex) {
          return false;
        }

        return root.getAttribute("data-pdf-ready") === "true" ? true : false;
      },
      spec.index,
      { timeout: READY_TIMEOUT_MS }
    );
  } catch (error) {
    const waiting = await page.evaluate(() =>
      document.documentElement.getAttribute("data-pdf-waiting")
    );
    const detail = waiting ? ` (waiting: ${waiting})` : "";
    throw new Error(
      `${spec.label} was not ready after ${READY_TIMEOUT_MS / 1000}s${detail}. ${
        error instanceof Error ? error.message : error
      }`
    );
  }

  const failure = await page.evaluate(() =>
    document.documentElement.getAttribute("data-pdf-error")
  );
  if (failure) {
    throw new Error(`${spec.label}: ${failure}`);
  }
}

/**
 * Moves to a booklet page.
 *
 * Leaving a map page requires a full reload: the Google Maps SDK can leave a
 * previous canvas mounted across client-side navigation (the app's own
 * `leaveMapTo` helper documents the same problem). Between text pages a soft
 * navigation is used instead, which preserves the in-memory logo cache.
 */
export async function gotoPlaybookPage(page, baseUrl, slugs, spec, previousSpec) {
  const mustReload = !previousSpec || previousSpec.renderMode === "raster";

  if (!mustReload) {
    const softNavigated = await page.evaluate((pageIndex) => {
      if (typeof window.__PLAYBOOK_GOTO__ !== "function") return false;
      window.__PLAYBOOK_GOTO__(pageIndex);
      return true;
    }, spec.index);

    if (softNavigated) {
      try {
        await page.waitForFunction(
          (expectedIndex) => {
            const mounted = document.querySelector("[data-page-index]");
            return (
              Boolean(mounted) &&
              Number(mounted.getAttribute("data-page-index")) === expectedIndex
            );
          },
          spec.index,
          { timeout: SOFT_NAV_TIMEOUT_MS }
        );
        return;
      } catch {
        // Fall through to a hard reload below.
      }
    }
  }

  await page.goto(playbookUrl(baseUrl, slugs, spec.index), {
    waitUntil: "domcontentloaded",
  });
}

async function capturePage(page, spec) {
  if (spec.renderMode === "vector") {
    return {
      kind: "pdf",
      bytes: await page.pdf({
        width: `${PAGE_WIDTH_PX}px`,
        height: `${PAGE_HEIGHT_PX}px`,
        printBackground: true,
        pageRanges: "1",
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      }),
    };
  }

  return {
    kind: "png",
    bytes: await page.screenshot({ type: "png", scale: "device" }),
  };
}

async function embedOverlayImage(doc, marker) {
  if (!marker?.png) return null;
  const bytes = Buffer.from(marker.png, "base64");
  const mime = String(marker.mime || "");
  try {
    if (mime.includes("jpeg") || mime.includes("jpg")) {
      return await doc.embedJpg(bytes);
    }
    return await doc.embedPng(bytes);
  } catch {
    try {
      return await doc.embedJpg(bytes);
    } catch {
      return null;
    }
  }
}

async function stampMarkerOverlays(doc, pdfPage, overlay) {
  const frameW = overlay?.width || INTERACTIVE_STREET_VIEWPORT.width;
  const frameH = overlay?.height || INTERACTIVE_STREET_VIEWPORT.height;
  for (const marker of overlay?.markers ?? []) {
    const markerImage = await embedOverlayImage(doc, marker);
    if (!markerImage) continue;
    const markerW = (marker.w / frameW) * PAGE_WIDTH_PT;
    const markerH = (marker.h / frameH) * PAGE_HEIGHT_PT;
    pdfPage.drawImage(markerImage, {
      x: (marker.x / frameW) * PAGE_WIDTH_PT,
      y: PAGE_HEIGHT_PT - (marker.y / frameH) * PAGE_HEIGHT_PT - markerH,
      width: markerW,
      height: markerH,
    });
  }
}

/**
 * Renders the booklet and returns the assembled PDF bytes.
 * One page that fails is recorded and skipped so the rest of the book
 * still downloads. Throws only when nothing could be rendered.
 */
export async function exportBooklet({
  slugs,
  baseUrl = DEFAULT_BASE_URL,
  outFile,
  onProgress,
  onPageError,
  streetMapOverlays = {},
  overviewCaptures = {},
  centerMapCaptures = {},
} = {}) {
  if (!Array.isArray(slugs) || slugs.length === 0) {
    throw new Error("Select at least one location to export.");
  }

  const browser = await chromium.launch({ args: WEBGL_ARGS });
  const context = await browser.newContext({
    viewport: { width: PAGE_WIDTH_PX, height: PAGE_HEIGHT_PX },
    // Raster pages need 300 DPI; vector pages ignore the ratio.
    deviceScaleFactor: RASTER_SCALE,
  });

  // Skip the access gate for this automated, local-only render.
  await context.addInitScript(
    ([key]) => {
      try {
        sessionStorage.setItem(key, "1");
      } catch {
        /* ignore */
      }
    },
    [ACCESS_SESSION_KEY]
  );

  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await installBrandfetchRetries(context);

  try {
    await page.goto(playbookUrl(baseUrl, slugs, 0), {
      waitUntil: "domcontentloaded",
    });

    const manifest = await readPlaybookManifest(page);
    if (!manifest?.pages?.length) {
      throw new Error(
        "The playbook route produced no pages. Check the selected slugs."
      );
    }

    const doc = await PDFDocument.create();
    let previousSpec = null;
    const skippedPages = [];

    for (const spec of manifest.pages) {
      onProgress?.({
        current: spec.index + 1,
        total: manifest.pages.length,
        label: spec.label,
      });

      try {
      if (isOverviewCapture(spec) && !overviewCaptures?.[spec.slug]?.png) {
        throw new Error(`${spec.label} is missing the browser logo capture.`);
      }
      if (isCenterMapCapture(spec) && !centerMapCaptures?.[spec.slug]?.png) {
        throw new Error(`${spec.label} is missing the browser logo capture.`);
      }
      if (
        isStreetMapCapture(spec) &&
        !streetMapOverlays?.[spec.slug]?.markers?.length
      ) {
        throw new Error(`${spec.label} is missing the browser logo capture.`);
      }

      if (isOverviewCapture(spec) && overviewCaptures?.[spec.slug]?.png) {
        const png = Buffer.from(overviewCaptures[spec.slug].png, "base64");
        previousSpec = spec;
        const image = await doc.embedPng(png);
        const pdfPage = doc.addPage([PAGE_WIDTH_PT, PAGE_HEIGHT_PT]);
        pdfPage.drawImage(image, {
          x: 0,
          y: 0,
          width: PAGE_WIDTH_PT,
          height: PAGE_HEIGHT_PT,
        });
        continue;
      }

      if (isCenterMapCapture(spec) && centerMapCaptures?.[spec.slug]?.png) {
        /*
         * Shopping centers always use the playbook map + directory overlay
         * (South Coast Plaza). Street-logo overlays are high-street only —
         * leftover One Colorado / The Paseo captures used to send Playwright
         * to /street/:slug/map, where it waited forever for Old Town pins.
         */
        if (previousSpec && leftInteractiveMap(previousSpec)) {
          await restorePlaybookViewport(page);
        }
        if (spec.index > 0) {
          await gotoPlaybookPage(page, baseUrl, slugs, spec, previousSpec);
        }
        await waitForPageReady(page, spec);
        await page.addStyleTag({
          content:
            ".shopping-center-directory { visibility: hidden !important; }",
        });
        await page.waitForTimeout(300);
        const png = await page.screenshot({ type: "png", scale: "device" });
        previousSpec = spec;

        const image = await doc.embedPng(png);
        const pdfPage = doc.addPage([PAGE_WIDTH_PT, PAGE_HEIGHT_PT]);
        pdfPage.drawImage(image, {
          x: 0,
          y: 0,
          width: PAGE_WIDTH_PT,
          height: PAGE_HEIGHT_PT,
        });

        const directoryPng = Buffer.from(
          centerMapCaptures[spec.slug].png,
          "base64"
        );
        const directoryImage = await doc.embedPng(directoryPng);
        pdfPage.drawImage(directoryImage, {
          x: 0,
          y: 0,
          width: PAGE_WIDTH_PT,
          height: PAGE_HEIGHT_PT,
        });
        continue;
      }

      if (isStreetMapCapture(spec)) {
        const overlay = streetMapOverlays?.[spec.slug];
        await gotoStreetMapCapture(page, baseUrl, spec.slug);
        await waitForStreetMapReady(page, spec.slug);
        if (overlay?.markers?.length) {
          await page.addStyleTag({
            content:
              'img[src^="data:image"] { visibility: hidden !important; }',
          });
          await page.waitForTimeout(300);
        }
        const png = await page.screenshot({ type: "png", scale: "device" });
        previousSpec = spec;

        const image = await doc.embedPng(png);
        const pdfPage = doc.addPage([PAGE_WIDTH_PT, PAGE_HEIGHT_PT]);
        pdfPage.drawImage(image, {
          x: 0,
          y: 0,
          width: PAGE_WIDTH_PT,
          height: PAGE_HEIGHT_PT,
        });

        await stampMarkerOverlays(doc, pdfPage, overlay);
        continue;
      }

      if (previousSpec && leftInteractiveMap(previousSpec)) {
        await restorePlaybookViewport(page);
      }

      if (spec.index > 0) {
        await gotoPlaybookPage(page, baseUrl, slugs, spec, previousSpec);
      }
      await waitForPageReady(page, spec);
      previousSpec = spec;

      const capture = await capturePage(page, spec);

      if (capture.kind === "pdf") {
        const source = await PDFDocument.load(capture.bytes);
        const [copied] = await doc.copyPages(source, [0]);
        copied.setSize(PAGE_WIDTH_PT, PAGE_HEIGHT_PT);
        doc.addPage(copied);
      } else {
        const image = await doc.embedPng(capture.bytes);
        const pdfPage = doc.addPage([PAGE_WIDTH_PT, PAGE_HEIGHT_PT]);
        pdfPage.drawImage(image, {
          x: 0,
          y: 0,
          width: PAGE_WIDTH_PT,
          height: PAGE_HEIGHT_PT,
        });
      }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const label = `${spec.label}: ${message}`;
        skippedPages.push(label);
        onPageError?.(label);
        console.error(`[export-booklet] skipped ${label}`);
        // Force the next page to reload instead of reusing a broken view.
        previousSpec = { ...spec, renderMode: "raster" };
      }
    }

    if (doc.getPageCount() === 0) {
      throw new Error(skippedPages[0] || "The booklet had no pages to export.");
    }

    const bytes = await doc.save();

    if (outFile) {
      await fs.mkdir(path.dirname(path.resolve(outFile)), { recursive: true });
      await fs.writeFile(path.resolve(outFile), bytes);
    }

    return {
      bytes,
      pageCount: doc.getPageCount(),
      pageErrors: skippedPages,
    };
  } finally {
    await context.close();
    await browser.close();
  }
}

function parseArgs(argv) {
  const args = { slugs: [], baseUrl: DEFAULT_BASE_URL, out: DEFAULT_OUT_FILE };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--slugs") {
      args.slugs = (argv[++i] ?? "")
        .split(",")
        .map((slug) => slug.trim())
        .filter(Boolean);
    } else if (arg === "--base-url") {
      args.baseUrl = argv[++i] ?? DEFAULT_BASE_URL;
    } else if (arg === "--out") {
      args.out = argv[++i] ?? DEFAULT_OUT_FILE;
    }
  }
  return args;
}

const isCli =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isCli) {
  const args = parseArgs(process.argv.slice(2));

  if (!args.slugs.length) {
    process.stderr.write(
      "Usage: node scripts/export-booklet.mjs --slugs slug-a,slug-b [--out file.pdf]\n"
    );
    process.exit(1);
  }

  try {
    const { pageCount } = await exportBooklet({
      slugs: args.slugs,
      baseUrl: args.baseUrl,
      outFile: args.out,
      onProgress: ({ current, total, label }) => {
        process.stdout.write(`[${current}/${total}] ${label}\n`);
      },
    });
    process.stdout.write(`Wrote ${args.out} (${pageCount} pages).\n`);
  } catch (error) {
    process.stderr.write(`Booklet export failed: ${error.message}\n`);
    process.exit(1);
  }
}
