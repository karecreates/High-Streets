import {
  getLogoDevImageUrl,
  getLogoDevNameImageUrl,
  isUsableBrandLogoDomain,
} from "./logoDev";
import { findBetaLogoUrls } from "./betaLogoLibrary";
import { getLocalLogoUrl, getLogoRouteOverride } from "./logoRouteOverrides";
import { trackPendingAsset } from "./pendingAssetWork";

export type LogoProviderId = "logo.dev" | "brandfetch";
export type BrandfetchAssetType = "logo" | "icon" | "symbol";
export type BrandfetchTheme = "dark" | "light";
export type BrandfetchFallback = "lettermark" | "404" | "transparent";

/** Locked to Brandfetch cascade (with Logo.dev / text fallbacks in loadBrandLogoImage). */
const DEFAULT_PROVIDER: LogoProviderId = "brandfetch";

const listeners = new Set<() => void>();

let currentProvider: LogoProviderId = DEFAULT_PROVIDER;

export function getLogoProvider(): LogoProviderId {
  return currentProvider;
}

/** No-op — provider UI was removed; cascade always starts at Brandfetch. */
export function setLogoProvider(_provider: LogoProviderId): void {
  if (currentProvider === DEFAULT_PROVIDER) return;
  currentProvider = DEFAULT_PROVIDER;
  syncLogoProviderDom(DEFAULT_PROVIDER);
  listeners.forEach((listener) => listener());
}

export function subscribeLogoProvider(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Client ID from Brandfetch developer dashboard (Logo API). */
const BRANDFETCH_CLIENT_ID_FALLBACK = "1idhiKzosQklQWdJCts";

export function getBrandfetchClientId(): string | null {
  const fromEnv = import.meta.env.VITE_BRANDFETCH_CLIENT_ID?.trim();
  return fromEnv || BRANDFETCH_CLIENT_ID_FALLBACK;
}

function cleanBrandDomain(domain: string | null | undefined): string | null {
  if (!isUsableBrandLogoDomain(domain)) return null;
  const clean = String(domain)
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .toLowerCase();
  return clean || null;
}

/**
 * Brandfetch Logo CDN URL.
 *
 * Always use fallback=404 — never Brandfetch branding or their lettermark tiles
 * (those clash with our beta-blue lettermarks). Missing assets fail so we draw
 * our own consistent initials.
 */
export function getBrandfetchImageUrl(
  domain: string | null | undefined,
  options?: {
    size?: number;
    type?: BrandfetchAssetType;
    theme?: BrandfetchTheme;
    fallback?: BrandfetchFallback;
    /** Wider box for horizontal wordmarks (logo type). */
    wide?: boolean;
  }
): string | null {
  const clientId = getBrandfetchClientId();
  if (!clientId) return null;
  const clean = cleanBrandDomain(domain);
  if (!clean) return null;

  const size = Math.max(64, Math.min(options?.size ?? 200, 512));
  const type = options?.type ?? "logo";
  const theme = options?.theme ?? "dark";
  const fallback = options?.fallback ?? "404";
  const width = options?.wide ? Math.round(size * 2.5) : size;
  const height = size;

  return (
    `https://cdn.brandfetch.io/domain/${encodeURIComponent(clean)}` +
    `/w/${width}/h/${height}/theme/${theme}/fallback/${fallback}/type/${type}` +
    `?c=${encodeURIComponent(clientId)}`
  );
}

/**
 * Candidate URLs for map / directory logos.
 *
 * Preferred cascade (Brandfetch mode):
 *   1) Brandfetch dark logo
 *   2) Brandfetch dark icon
 *   3) Logo.dev
 *   4) Local Beta library, only when the steps above miss
 * Logo.dev mode: Logo.dev only.
 * Per-domain overrides in logoRouteOverrides.ts win over the cascade.
 * Callers show plain-text / lettermark when all URLs fail.
 */
export function getBrandLogoImageUrls(
  domain: string | null | undefined,
  options?: { size?: number }
): string[] {
  const size = options?.size;
  const route = getLogoRouteOverride(domain);

  if (route === "text") return [];

  if (route === "local") {
    return [getLocalLogoUrl(domain)].filter(
      (url): url is string => Boolean(url)
    );
  }

  if (route === "logo.dev") {
    return [getLogoDevImageUrl(domain, options)].filter(
      (url): url is string => Boolean(url)
    );
  }

  if (route === "brandfetch-light") {
    return [
      getBrandfetchImageUrl(domain, {
        size,
        type: "logo",
        theme: "light",
        fallback: "404",
        wide: true,
      }),
    ].filter((url): url is string => Boolean(url));
  }

  if (route === "brandfetch-logo-dark") {
    return [
      getBrandfetchImageUrl(domain, {
        size,
        type: "logo",
        theme: "dark",
        fallback: "404",
        wide: true,
      }),
    ].filter((url): url is string => Boolean(url));
  }

  if (route === "brandfetch-icon-dark") {
    return [
      getBrandfetchImageUrl(domain, {
        size,
        type: "icon",
        theme: "dark",
        fallback: "404",
      }),
    ].filter((url): url is string => Boolean(url));
  }

  if (route === "brandfetch-symbol-dark") {
    return [
      getBrandfetchImageUrl(domain, {
        size,
        type: "symbol",
        theme: "dark",
        fallback: "404",
      }),
    ].filter((url): url is string => Boolean(url));
  }

  const urls: Array<string | null> = [];

  if (getLogoProvider() === "brandfetch") {
    urls.push(
      getBrandfetchImageUrl(domain, {
        size,
        type: "logo",
        theme: "dark",
        fallback: "404",
        wide: true,
      }),
      getBrandfetchImageUrl(domain, {
        size,
        type: "icon",
        theme: "dark",
        fallback: "404",
      }),
      getLogoDevImageUrl(domain, options)
    );
  } else {
    urls.push(getLogoDevImageUrl(domain, options));
  }

  return urls.filter((url): url is string => Boolean(url));
}

/** First candidate URL. */
export function getBrandLogoImageUrl(
  domain: string | null | undefined,
  options?: { size?: number }
): string | null {
  return getBrandLogoImageUrls(domain, options)[0] ?? null;
}

/**
 * Name-based logos are logo.dev-only (Brandfetch needs a domain).
 * Used rarely; map markers use domains.
 */
export function getBrandLogoNameImageUrl(brandName: string): string | null {
  return getLogoDevNameImageUrl(brandName);
}

function syncLogoProviderDom(provider: LogoProviderId): void {
  try {
    document.documentElement.dataset.logoProvider = provider;
  } catch {
    /* SSR / non-DOM */
  }
}

// Keep CSS hooks in sync with the active provider (incl. initial load).
if (typeof document !== "undefined") {
  syncLogoProviderDom(currentProvider);
}

/** A decode that never settles would stall the booklet's readiness gate. */
const IMAGE_LOAD_TIMEOUT_MS = 15_000;

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let timer = 0;
    const settle = (fn: () => void) => {
      window.clearTimeout(timer);
      fn();
    };
    img.crossOrigin = "anonymous";
    img.onload = () => settle(() => resolve(img));
    img.onerror = () =>
      settle(() => reject(new Error(`Logo failed to load: ${url}`)));
    timer = window.setTimeout(() => {
      img.src = "";
      reject(new ThrottledLogoError(`Logo timed out: ${url}`));
    }, IMAGE_LOAD_TIMEOUT_MS);
    img.src = url;
  });
}

/**
 * Booklet export only.
 *
 * A booklet page asks for every tenant logo at once — a hundred parallel
 * requests — which trips the Brandfetch CDN's rate limit. A plain <img> reports
 * 429 as a generic error, so those logos would silently vanish from the PDF.
 * When enabled, loads are queued at a modest concurrency and go through fetch()
 * so a 429 is visible and can be retried with backoff.
 */
let retryThrottledLogos = false;
const THROTTLE_RETRIES = 5;
const THROTTLE_BASE_DELAY_MS = 500;
const MAX_CONCURRENT_LOGO_LOADS = 6;
const THROTTLE_FETCH_TIMEOUT_MS = 12_000;
/** Cool-off rounds before a throttled candidate is finally given up on. */
const THROTTLE_COOLOFF_MS = [4_000, 8_000, 16_000];

/** A rate limit or timeout — says nothing about whether the asset exists. */
class ThrottledLogoError extends Error {
  override name = "ThrottledLogoError";
}

export function enableThrottledLogoRetries(): void {
  retryThrottledLogos = true;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

let activeLogoLoads = 0;
const logoLoadQueue: Array<() => void> = [];

function acquireLogoSlot(): Promise<void> {
  if (activeLogoLoads < MAX_CONCURRENT_LOGO_LOADS) {
    activeLogoLoads += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    logoLoadQueue.push(() => {
      activeLogoLoads += 1;
      resolve();
    });
  });
}

function releaseLogoSlot(): void {
  activeLogoLoads = Math.max(0, activeLogoLoads - 1);
  logoLoadQueue.shift()?.();
}

async function loadHtmlImageWithRetries(
  url: string
): Promise<HTMLImageElement> {
  if (!retryThrottledLogos) return loadHtmlImage(url);

  await acquireLogoSlot();
  try {
    return await fetchImageWithBackoff(url);
  } finally {
    releaseLogoSlot();
  }
}

async function fetchImageWithBackoff(
  url: string
): Promise<HTMLImageElement> {
  for (let attempt = 0; attempt <= THROTTLE_RETRIES; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, {
        mode: "cors",
        credentials: "omit",
        signal: AbortSignal.timeout(THROTTLE_FETCH_TIMEOUT_MS),
      });
    } catch {
      // CORS/network refusal says nothing about throttling; use the <img> path.
      return loadHtmlImage(url);
    }

    if (response.status === 429 || response.status >= 500) {
      if (attempt === THROTTLE_RETRIES) {
        throw new ThrottledLogoError(
          `Logo throttled (${response.status}): ${url}`
        );
      }
      await delay(THROTTLE_BASE_DELAY_MS * 2 ** attempt);
      continue;
    }

    if (!response.ok) {
      throw new Error(`Logo failed to load (${response.status}): ${url}`);
    }

    const blob = await response.blob();
    return loadHtmlImage(URL.createObjectURL(blob));
  }

  throw new Error(`Logo failed to load: ${url}`);
}

/** True when the raster has almost no contrast against `bg`. */
function isNearlyInvisibleOnBackground(
  img: HTMLImageElement,
  bg: string
): boolean {
  try {
    const canvas = document.createElement("canvas");
    const w = Math.min(32, img.naturalWidth || 32);
    const h = Math.min(32, img.naturalHeight || 32);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    const bgMatch = /^#?([0-9a-f]{6})$/i.exec(bg.trim());
    const br = bgMatch ? parseInt(bgMatch[1].slice(0, 2), 16) : 255;
    const bgG = bgMatch ? parseInt(bgMatch[1].slice(2, 4), 16) : 255;
    const bb = bgMatch ? parseInt(bgMatch[1].slice(4, 6), 16) : 255;
    let ink = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 20) continue;
      const dr = data[i] - br;
      const dg = data[i + 1] - bgG;
      const db = data[i + 2] - bb;
      if (dr * dr + dg * dg + db * db > 40 * 40) ink++;
    }
    return ink < 8;
  } catch {
    return false;
  }
}

/**
 * White and pale-yellow artwork disappears in the white callout.
 * Gold and other real brand colors still count.
 */
function isTooLightOnWhite(img: HTMLImageElement): boolean {
  try {
    const canvas = document.createElement("canvas");
    const w = Math.min(32, img.naturalWidth || 32);
    const h = Math.min(32, img.naturalHeight || 32);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    let readable = 0;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3] / 255;
      if (alpha < 0.08) continue;
      const r = data[i] * alpha + 255 * (1 - alpha);
      const g = data[i + 1] * alpha + 255 * (1 - alpha);
      const b = data[i + 2] * alpha + 255 * (1 - alpha);
      if (relativeLuminance(r, g, b) <= 0.62) readable += 1;
    }
    return readable < 8;
  } catch {
    return false;
  }
}

function relativeLuminance(r: number, g: number, b: number): number {
  const channel = (value: number) => {
    const s = value / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * Every tenant logo resolves at one size so a domain always lands on the same
 * cascade step — otherwise a marker and its info window can show different
 * assets for the same brand.
 */
const CANONICAL_LOGO_SIZE = 256;

const resolvedLogoCache = new Map<string, Promise<HTMLImageElement | null>>();

/**
 * Load a map/directory brand logo with cascade:
 *   Brandfetch dark logo → local Beta library → Brandfetch dark icon → Logo.dev → null
 * Skips Brandfetch branding tiles and white-on-white ghosts.
 *
 * Resolution is cached per domain and shared by markers, info windows and
 * directories so one brand never renders two different logos.
 */
export function loadBrandLogoImage(
  domain: string | null | undefined,
  brandName?: string | null
): Promise<HTMLImageElement | null> {
  const clean = cleanBrandDomain(domain);
  const name = brandName?.trim() ?? "";
  if (!clean && !name) return Promise.resolve(null);

  const cacheKey = `${clean ?? ""}|${name.toLowerCase()}`;
  const cached = resolvedLogoCache.get(cacheKey);
  if (cached) return cached;

  const pending = trackPendingAsset(resolveBrandLogoImage(clean, name));
  resolvedLogoCache.set(cacheKey, pending);
  return pending;
}

/**
 * Hand-picked local files stay exclusive. Everything else may fall through
 * to the retail/restaurant folders when the earlier asset is missing or too
 * light to read on white. A letter-only ("text") route is a missing logo,
 * so the folder is allowed to fill it.
 */
function withLocalLogoBackup(
  domain: string | null,
  brandName: string,
  urls: string[]
): string[] {
  const route = domain ? getLogoRouteOverride(domain) : null;
  if (route === "local") return urls;
  const local = findBetaLogoUrls(brandName, domain);
  if (!local.length) return urls;
  const next = [...urls];
  const curatedFirst =
    route === "logo.dev" ||
    route === "brandfetch-light" ||
    route === "brandfetch-icon-dark" ||
    route === "brandfetch-symbol-dark" ||
    route === "text";
  if (curatedFirst) {
    next.push(...local.filter((url) => !next.includes(url)));
    return next;
  }
  const darkLogo = next.findIndex(
    (url) => url.includes("/theme/dark/") && url.includes("/type/logo")
  );
  const at = darkLogo >= 0 ? darkLogo + 1 : next.length;
  next.splice(
    at,
    0,
    ...local.filter((url) => !next.includes(url))
  );
  return next;
}

async function resolveBrandLogoImage(
  domain: string | null,
  brandName: string
): Promise<HTMLImageElement | null> {
  const urls = withLocalLogoBackup(
    domain,
    brandName,
    domain ? getBrandLogoImageUrls(domain, { size: CANONICAL_LOGO_SIZE }) : []
  );
  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i];
    try {
      const img = await loadHtmlImageWithRetries(url);
      const fromBrandfetch = url.includes("cdn.brandfetch.io");
      if (fromBrandfetch && (await isBrandfetchPlaceholderImage(img))) {
        continue;
      }
      // White and pale marks disappear in the white callout, whatever the source.
      if (isTooLightOnWhite(img)) continue;
      return img;
    } catch (error) {
      /*
       * Rate-limit / timeout is not "this brand has no wordmark." Falling
       * through to type=icon is how J.Crew becomes a green circle in the PDF
       * while the Interactive Map still shows the black wordmark.
       */
      if (
        error instanceof ThrottledLogoError &&
        url.includes("/type/logo")
      ) {
        while (i + 1 < urls.length && urls[i + 1].includes("/type/icon")) {
          i += 1;
        }
      }
    }
  }
  return null;
}

/**
 * Notable Brands only: Brandfetch horizontal dark logo (type=logo, theme=dark).
 * No icons, no light logos, no logo.dev, no lettermark fallbacks.
 */
export async function loadBrandfetchDarkLogo(
  domain: string | null | undefined,
  options?: { size?: number }
): Promise<HTMLImageElement | null> {
  return loadBrandfetchTypeLogo(domain, {
    size: options?.size ?? 200,
    theme: "dark",
  });
}

function loadBrandfetchTypeLogo(
  domain: string | null | undefined,
  options: { size?: number; theme: BrandfetchTheme }
): Promise<HTMLImageElement | null> {
  return trackPendingAsset(fetchBrandfetchTypeLogo(domain, options));
}

async function fetchBrandfetchTypeLogo(
  domain: string | null | undefined,
  options: { size?: number; theme: BrandfetchTheme }
): Promise<HTMLImageElement | null> {
  const url = getBrandfetchImageUrl(domain, {
    size: options.size ?? 200,
    type: "logo",
    theme: options.theme,
    fallback: "404",
    wide: true,
  });
  if (!url) return null;
  try {
    const img = await loadHtmlImageWithRetries(url);
    if (await isBrandfetchPlaceholderImage(img)) return null;
    if (isNearlyInvisibleOnBackground(img, "#FFFFFF")) return null;
    return img;
  } catch {
    return null;
  }
}

const brandfetchLogoAttributionCache = new Map<string, boolean>();
const brandfetchLogoAttributionInflight = new Map<string, Promise<boolean>>();

/**
 * True when Brandfetch serves a real type=logo asset for this domain.
 * Used by the Major Tenants map filter (excludes icons, symbols, logo.dev, text).
 */
export async function hasBrandfetchLogoAttribution(
  domain: string | null | undefined
): Promise<boolean> {
  const clean = cleanBrandDomain(domain);
  if (!clean) return false;

  const cached = brandfetchLogoAttributionCache.get(clean);
  if (cached !== undefined) return cached;

  const inflight = brandfetchLogoAttributionInflight.get(clean);
  if (inflight) return inflight;

  const promise = (async () => {
    const route = getLogoRouteOverride(clean);
    if (
      route === "text" ||
      route === "local" ||
      route === "logo.dev" ||
      route === "brandfetch-icon-dark" ||
      route === "brandfetch-symbol-dark"
    ) {
      return false;
    }

    const theme: BrandfetchTheme =
      route === "brandfetch-light" ? "light" : "dark";
    const img = await loadBrandfetchTypeLogo(clean, { size: 160, theme });
    return img != null;
  })().then((result) => {
    brandfetchLogoAttributionCache.set(clean, result);
    brandfetchLogoAttributionInflight.delete(clean);
    return result;
  });

  brandfetchLogoAttributionInflight.set(clean, promise);
  return promise;
}

/** Fingerprint Brandfetch's own wordmark so we never paint it as a tenant logo. */
let placeholderFingerprint: string | null | undefined;

async function getBrandfetchPlaceholderFingerprint(): Promise<string | null> {
  if (placeholderFingerprint !== undefined) return placeholderFingerprint;
  try {
    const clientId = getBrandfetchClientId();
    if (!clientId) {
      placeholderFingerprint = null;
      return null;
    }
    // Deliberately omit lettermark/404 so we get their branding asset as reference.
    const img = await loadHtmlImage(
      `https://cdn.brandfetch.io/domain/brandfetch.com/w/200/h/200/theme/dark/type/logo?c=${encodeURIComponent(clientId)}`
    );
    placeholderFingerprint = fingerprintImage(img);
    return placeholderFingerprint;
  } catch {
    placeholderFingerprint = null;
    return null;
  }
}

function fingerprintImage(img: HTMLImageElement): string | null {
  try {
    const size = 16;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    let hash = "";
    for (let i = 0; i < data.length; i += 16) {
      hash += Math.round((data[i] + data[i + 1] + data[i + 2]) / 48).toString(16);
    }
    return hash;
  } catch {
    return null;
  }
}

export async function isBrandfetchPlaceholderImage(
  img: HTMLImageElement
): Promise<boolean> {
  const placeholder = await getBrandfetchPlaceholderFingerprint();
  const mine = fingerprintImage(img);
  return Boolean(placeholder && mine && placeholder === mine);
}
