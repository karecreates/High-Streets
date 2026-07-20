function normalizeDomain(domain: string): string {
  return domain
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0];
}

/**
 * Logo.dev image URL for a verified brand DOMAIN (publishable key, safe in the
 * browser). Domains come from the Brand Search API (see scripts/resolve-logos.mjs),
 * so matches are exact — we never use the fuzzy name-based endpoint.
 */
export function getLogoDevImageUrl(domain: string | null | undefined): string | null {
  const token = import.meta.env.VITE_LOGO_DEV_TOKEN?.trim();
  if (!token) return null;

  const cleanDomain = normalizeDomain(domain ?? "");
  if (!cleanDomain) return null;

  const params = new URLSearchParams({
    token,
    format: "png",
    size: "80",
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
