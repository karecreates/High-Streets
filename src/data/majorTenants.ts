/**
 * Curated "Major Tenants" allowlists by corridor slug.
 * When present, the map toggle filters to these names (exact, case-insensitive)
 * instead of the Brandfetch logo heuristic.
 */
export const MAJOR_TENANTS_BY_SLUG: Record<string, readonly string[]> = {
  "abbot-kinney": [
    "Everlane",
    "Blue Bottle Coffee",
    "Away",
    "Vuori",
    "Mejuri",
    "Rag & Bone",
    "Lululemon Athletica",
    "Suit Supply",
    "Marine Layer",
    "Madewell",
    "Joe & The Juice",
    "Birkenstock",
    "JINS",
    "Aviator Nation",
    "Alo Yoga",
    "Intelligentsia Coffee",
    "Hoka",
    "Todd Snyder",
    "J Crew",
    "Faherty Brand",
    "Adidas",
    "Vince",
    "Salt & Straw",
    "gorjana",
    "Ray Ban",
    "Warby Parker",
    "Aesop",
    "Buck Mason",
    "FP Movement",
    "Alfred Coffee",
    "Levain Bakery",
    "Erewhon Market",
    "Oakberry",
    "All'antico Vinaio",
  ],
  "third-street-promenade": [
    "John Reed Fitness",
    "Chipotle",
    "Sephora",
    "AMC Entertainment",
    "Victoria's Secret",
    "Barnes & Noble",
    "Yogurtland",
    "Skechers",
    "Adidas",
    "Zara",
    "Patagonia",
    "WILSON",
    "Lids",
    "Oakley",
    "Beyond Yoga",
    "Raising Canes",
    "Apple Store",
    "Alo Yoga",
    "Vans Inc. (VF Sportswear)",
    "Uniqlo",
    "JD Sports",
    "Urban Outfitters",
    "Pac Sun",
    "Lululemon Athletica",
    "Silverlake Ramen",
    "McConnell's Fine Ice Creams",
  ],
};

/** Corridors that should open the map with Major Tenants already on. */
export const MAJOR_TENANTS_DEFAULT_ON = new Set([
  "abbot-kinney",
  "third-street-promenade",
]);

/** Manual callout tweaks for dense clusters (anchors stay on true lat/lng). */
export interface MajorTenantLayoutOverride {
  placement?: "above" | "below";
  /** Negative = left of pin; positive = right. */
  offsetX?: number;
  stemHeight?: number;
}

export const MAJOR_TENANT_LAYOUT_OVERRIDES_BY_SLUG: Record<
  string,
  Record<string, MajorTenantLayoutOverride>
> = {
  "abbot-kinney": {
    "blue bottle coffee": { placement: "above" },
    away: { placement: "above" },
    everlane: { placement: "above", offsetX: -62 },
    gorjana: { placement: "above" },
    madewell: { placement: "above", stemHeight: 16 },
    jins: { placement: "above", stemHeight: 14 },
    "joe & the juice": { stemHeight: 12 },
    "ray ban": { placement: "above", stemHeight: 14 },
    "rag & bone": { placement: "above", stemHeight: 14 },
    "marine layer": { placement: "below", stemHeight: 64 },
    "suit supply": { placement: "below", stemHeight: 48 },
    "lululemon athletica": { placement: "above", stemHeight: 10 },
    "all'antico vinaio": { placement: "above", stemHeight: 14 },
    hoka: { placement: "above", stemHeight: 14 },
    "intelligentsia coffee": { placement: "above", stemHeight: 14 },
    birkenstock: { placement: "below", stemHeight: 14 },
    adidas: { placement: "above", stemHeight: 14 },
    vince: { placement: "above", stemHeight: 14 },
    "salt & straw": { placement: "above", stemHeight: 14 },
    "todd snyder": { placement: "below", stemHeight: 12 },
    "alfred coffee": { stemHeight: 12 },
    // Keep these short — nearby Alfred/All'antico forcing was stretching them.
    "buck mason": { placement: "above", stemHeight: 12 },
    "fp movement": { placement: "below", stemHeight: 12 },
  },
  /**
   * Third Street Promenade — Abbot Kinney style:
   * full-size logos, short stems, UP/DOWN + intentional LEFT/RIGHT.
   * Co-located pairs are separate pins (one above, one below).
   */
  "third-street-promenade": {
    // North / east
    "john reed fitness": { placement: "above", stemHeight: 12 },
    chipotle: { placement: "above", stemHeight: 14, offsetX: 48 },
    sephora: { placement: "below", stemHeight: 12 },
    "victoria's secret": { placement: "above", stemHeight: 12 },
    // Same above/below sandwich as Patagonia / Wilson
    "silverlake ramen": { placement: "above", stemHeight: 12 },
    yogurtland: { placement: "below", stemHeight: 12 },
    adidas: { placement: "above", stemHeight: 12, offsetX: 80 },
    patagonia: { placement: "above", stemHeight: 12 },
    wilson: { placement: "below", stemHeight: 12 },
    // Keep Beyond Yoga / Cane’s east of the Starbucks pile-up
    "beyond yoga": { placement: "above", stemHeight: 12, offsetX: 52 },
    "raising canes": { placement: "below", stemHeight: 12, offsetX: 52 },
    "apple store": { placement: "above", stemHeight: 14, offsetX: 28 },
    uniqlo: { placement: "above", stemHeight: 12, offsetX: 60 },
    "lululemon athletica": { placement: "above", stemHeight: 14, offsetX: -52 },
    "mcconnell's fine ice creams": {
      placement: "below",
      stemHeight: 14,
      offsetX: 72,
    },

    // West side
    "amc entertainment": { placement: "above", stemHeight: 12 },
    "barnes & noble": { placement: "above", stemHeight: 12, offsetX: 40 },
    skechers: { placement: "above", stemHeight: 12 },
    lids: { placement: "below", stemHeight: 12, offsetX: -40 },
    zara: { placement: "below", stemHeight: 14, offsetX: -56 },
    oakley: { placement: "below", stemHeight: 12, offsetX: 36 },
    "alo yoga": { placement: "below", stemHeight: 12, offsetX: -48 },
    "vans inc. (vf sportswear)": {
      placement: "above",
      stemHeight: 12,
      offsetX: -48,
    },
    // Fan south cluster — clear of Uniqlo / Lulu / McConnell’s
    "jd sports": { placement: "below", stemHeight: 12, offsetX: -60 },
    "urban outfitters": { placement: "below", stemHeight: 64, offsetX: -60 },
    "pac sun": { placement: "above", stemHeight: 12, offsetX: 52 },
  },
};

export function normalizeTenantName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Address substrings to omit from major-tenants mode (case-insensitive).
 * Used when the same brand has multiple mapped locations.
 */
export const MAJOR_TENANT_ADDRESS_EXCLUSIONS_BY_SLUG: Record<
  string,
  readonly string[]
> = {
  "abbot-kinney": ["1201 Abbot Kinney"],
};

export function getMajorTenantAllowlist(
  slug: string | undefined
): ReadonlySet<string> | null {
  if (!slug) return null;
  const names = MAJOR_TENANTS_BY_SLUG[slug];
  if (!names?.length) return null;
  return new Set(names.map(normalizeTenantName));
}

export function getMajorTenantAddressExclusions(
  slug: string | undefined
): readonly string[] {
  if (!slug) return [];
  return MAJOR_TENANT_ADDRESS_EXCLUSIONS_BY_SLUG[slug] ?? [];
}

function addressIsExcluded(
  address: string,
  exclusions: readonly string[]
): boolean {
  if (!exclusions.length) return false;
  const normalized = address.trim().toLowerCase();
  return exclusions.some((ex) => normalized.includes(ex.trim().toLowerCase()));
}

/** True when this tenant should appear in major-tenants mode for the corridor. */
export function isMajorTenantAllowed(
  slug: string | undefined,
  tenant: { tenantName: string; address: string },
  allowlist: ReadonlySet<string> | null
): boolean {
  if (!allowlist?.has(normalizeTenantName(tenant.tenantName))) return false;
  return !addressIsExcluded(
    tenant.address,
    getMajorTenantAddressExclusions(slug)
  );
}

/** Merge per-tenant overrides for a co-located marker group. */
export function getMajorTenantLayoutOverride(
  slug: string | undefined,
  tenantNames: readonly string[]
): MajorTenantLayoutOverride | null {
  if (!slug) return null;
  const byName = MAJOR_TENANT_LAYOUT_OVERRIDES_BY_SLUG[slug];
  if (!byName) return null;

  const merged: MajorTenantLayoutOverride = {};
  let found = false;
  for (const name of tenantNames) {
    const override = byName[normalizeTenantName(name)];
    if (!override) continue;
    Object.assign(merged, override);
    found = true;
  }
  return found ? merged : null;
}
