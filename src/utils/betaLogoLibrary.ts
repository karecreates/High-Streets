/**
 * Local backup for brands Brandfetch has no dark wordmark for.
 * Files live in assets/Beta LOGOS and are served from /beta-logos
 * (public/beta-logos → that folder). The index is built by
 * scripts/build-beta-logo-index.mjs. Brandfetch dark logos still win
 * when they exist; this library is the next step.
 */
import index from "../data/betaLogoIndex.json";

const byKey = (index as { entries: Record<string, string[]> }).entries;

const NOISE = new Set([
  "logo",
  "logos",
  "logotype",
  "wordmark",
  "primary",
  "vector",
  "official",
  "horizontal",
  "stacked",
  "seeklogo",
  "trademark",
  "rgb",
  "icon",
  "badge",
  "web",
  "final",
  "copy",
  "large",
  "small",
  "sm",
  "lg",
  "beta",
  "black",
  "dark",
  "white",
  "light",
  "transparent",
  "knockout",
  "color",
  "colour",
  "lockup",
  "png",
  "jpg",
  "svg",
  "webp",
  "avif",
  "jpeg",
  "img",
  "image",
  "pantone",
  "bg",
  "background",
]);

const TRAILING = [
  "and tea",
  "coffee and tea",
  "fragrances",
  "fragrance",
  "athletica",
  "cosmetics",
  "boutique",
  "restaurant",
  "kitchen",
];

function normalizeBrandLabel(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .replace(/\+/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word && !NOISE.has(word) && !/^\d+$/.test(word))
    .join(" ")
    .replace(/\b(inc|llc|ltd|corp|corporation|company|limited)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function lookupKeys(label: string): string[] {
  const key = normalizeBrandLabel(label);
  const keys: string[] = [];
  const add = (value: string) => {
    const compact = value.replace(/ /g, "");
    if (value.length >= 3) keys.push(value);
    if (compact.length >= 3 && compact !== value) keys.push(compact);
  };
  add(key);
  const withoutThe = key.startsWith("the ") ? key.slice(4) : key;
  if (withoutThe !== key) add(withoutThe);
  for (const suffix of TRAILING) {
    const stem = withoutThe.endsWith(` ${suffix}`)
      ? withoutThe.slice(0, -(suffix.length + 1)).trim()
      : "";
    if (stem.length >= 6) add(stem);
  }
  return keys;
}

function domainStem(domain: string): string {
  return domain.split(".")[0]?.replace(/-/g, " ") ?? "";
}

function toPublicUrl(rel: string): string {
  return `/beta-logos/${rel.split("/").map(encodeURIComponent).join("/")}`;
}

/** Local logo URLs for a tenant name and/or domain, best file first. */
export function findBetaLogoUrls(
  brandName?: string | null,
  domain?: string | null
): string[] {
  const labels = [brandName, domain ? domainStem(domain) : ""].filter(
    (label): label is string => Boolean(label?.trim())
  );
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const label of labels) {
    for (const key of lookupKeys(label)) {
      const hits = byKey[key];
      if (!hits) continue;
      for (const rel of hits) {
        const url = toPublicUrl(rel);
        if (seen.has(url)) continue;
        seen.add(url);
        urls.push(url);
      }
    }
  }
  return urls.slice(0, 4);
}
