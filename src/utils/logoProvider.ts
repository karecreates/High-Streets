import {
  getLogoDevImageUrl,
  getLogoDevNameImageUrl,
  isUsableBrandLogoDomain,
} from "./logoDev";
import { getLocalLogoUrl, getLogoRouteOverride } from "./logoRouteOverrides";

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

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Logo failed to load: ${url}`));
    img.src = url;
  });
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
    // Parse bg roughly for distance check.
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
 * Load a map/directory brand logo with cascade:
 *   Brandfetch dark logo → Brandfetch dark icon → Logo.dev → null (plain text)
 * Skips Brandfetch branding tiles and white-on-white ghosts.
 */
export async function loadBrandLogoImage(
  domain: string | null | undefined,
  options?: { size?: number }
): Promise<HTMLImageElement | null> {
  const urls = getBrandLogoImageUrls(domain, options);
  for (const url of urls) {
    try {
      const img = await loadHtmlImage(url);
      const fromBrandfetch = url.includes("cdn.brandfetch.io");
      if (fromBrandfetch && (await isBrandfetchPlaceholderImage(img))) {
        continue;
      }
      if (isNearlyInvisibleOnBackground(img, "#FFFFFF")) continue;
      return img;
    } catch {
      /* try next */
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

async function loadBrandfetchTypeLogo(
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
    const img = await loadHtmlImage(url);
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
