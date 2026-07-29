/**
 * Shared logo-domain guards for convert / resolve scripts.
 * Keep in sync with src/utils/logoDev.ts `isUsableBrandLogoDomain`.
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

export function normalizeLogoDomain(domain) {
  return String(domain ?? "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .toLowerCase();
}

/** Social / short-link hosts must never be stamped as brand logos. */
export function isUsableBrandLogoDomain(domain) {
  const clean = normalizeLogoDomain(domain);
  if (!clean) return false;
  return !NON_BRAND_LOGO_HOSTS.some(
    (host) => clean === host || clean.endsWith(`.${host}`)
  );
}

/**
 * Return a brand logo domain, or "" / null when unusable.
 * @param {string | null | undefined} domain
 * @param {{ empty?: "" | null }} [opts]
 */
export function sanitizeLogoDomain(domain, opts = {}) {
  const empty = opts.empty === null ? null : "";
  const clean = normalizeLogoDomain(domain);
  if (!clean || !isUsableBrandLogoDomain(clean)) return empty;
  return clean;
}
