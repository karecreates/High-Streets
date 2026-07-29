function normalizeDomain(domain: string): string {
  return domain
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0];
}

/**
 * Social / link-in-bio / maps hosts — never treat these as a brand logo.
 * logo.dev would return the Instagram (etc.) mark, which is wrong for tenants.
 */
const NON_BRAND_LOGO_HOSTS = [
  "instagram.com",
  "facebook.com",
  "fb.com",
  "m.facebook.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "linktr.ee",
  "linktree.com",
  "yelp.com",
  "maps.google.com",
  "goo.gl",
  "maps.app.goo.gl",
  "bit.ly",
  "wa.me",
  "whatsapp.com",
  "youtube.com",
  "youtu.be",
  "pinterest.com",
  "threads.net",
  "nextdoor.com",
];

/** True when this domain is safe to fetch as a tenant/brand logo. */
export function isUsableBrandLogoDomain(
  domain: string | null | undefined
): boolean {
  const clean = normalizeDomain(domain ?? "").toLowerCase();
  if (!clean) return false;
  return !NON_BRAND_LOGO_HOSTS.some(
    (host) => clean === host || clean.endsWith(`.${host}`)
  );
}

/**
 * Logo.dev image URL for a verified brand DOMAIN (publishable key, safe in the
 * browser). Domains come from the Brand Search API (see scripts/resolve-logos.mjs),
 * so matches are exact — we never use the fuzzy name-based endpoint.
 */
export function getLogoDevImageUrl(
  domain: string | null | undefined,
  options?: { size?: number }
): string | null {
  const token = import.meta.env.VITE_LOGO_DEV_TOKEN?.trim();
  if (!token) return null;

  const cleanDomain = normalizeDomain(domain ?? "");
  if (!cleanDomain || !isUsableBrandLogoDomain(cleanDomain)) return null;

  const size = Math.max(64, Math.min(options?.size ?? 200, 512));
  const params = new URLSearchParams({
    token,
    format: "png",
    size: String(size),
    theme: "light",
    fallback: "404",
  });

  return `https://img.logo.dev/${encodeURIComponent(cleanDomain)}?${params}`;
}

/**
 * Logo.dev's fuzzy name-search endpoint. Only for hand-curated brand lists
 * (e.g. a corridor's notable brands on the detail page) where names are known
 * to be well-known brands. NEVER use this for arbitrary tenant data — it
 * returns wrong logos for obscure names. Map markers use domains only.
 */
export function getLogoDevNameImageUrl(brandName: string): string | null {
  const token = import.meta.env.VITE_LOGO_DEV_TOKEN?.trim();
  if (!token) return null;

  const name = brandName.trim();
  if (!name) return null;

  const params = new URLSearchParams({
    token,
    format: "png",
    size: "80",
    theme: "light",
    fallback: "404",
  });

  return `https://img.logo.dev/name/${encodeURIComponent(name)}?${params}`;
}
