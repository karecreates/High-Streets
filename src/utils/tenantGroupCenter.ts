import {
  getShoppingCenter,
  type ShoppingCenter,
} from "../data/shoppingCenters";
import type { Tenant } from "../types/tenant";

interface TenantGroupCenterRule {
  slug: string;
  /** Match CoStar / street-tenant address labels for this center. */
  addressTest: (address: string) => boolean;
  /** Center rows that shouldn't appear as tenants in the grid. */
  excludeTenantNames: string[];
}

const TENANT_GROUP_CENTER_RULES: TenantGroupCenterRule[] = [
  {
    slug: "figat7th",
    addressTest: (address) => /figat?\s*7th/i.test(address),
    excludeTenantNames: ["FIGAT7TH", "FIGat7th", "Figat7th"],
  },
  {
    slug: "la-live",
    addressTest: (address) => /l\.?\s*a\.?\s*live/i.test(address),
    excludeTenantNames: ["L.A. Live", "LA Live", "LA LIVE", "L.A. LIVE"],
  },
];

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export interface ResolvedTenantGroupCenter {
  center: ShoppingCenter;
  /** Tenants to plot under the center header (center row removed). */
  tenants: Tenant[];
}

/**
 * When a location group is a known shopping center (FIGat7th, L.A. Live),
 * return the center branding + filtered tenant list for a headed marker.
 */
export function resolveTenantGroupCenter(group: {
  address: string;
  tenants: Tenant[];
}): ResolvedTenantGroupCenter | null {
  const address = group.address?.trim() ?? "";
  if (!address) return null;

  const rule = TENANT_GROUP_CENTER_RULES.find((entry) =>
    entry.addressTest(address)
  );
  if (!rule) return null;

  const center = getShoppingCenter(rule.slug);
  if (!center) return null;

  const excluded = new Set(
    rule.excludeTenantNames.map((name) => normalizeName(name))
  );
  const tenants = group.tenants.filter(
    (tenant) => !excluded.has(normalizeName(tenant.tenantName))
  );

  return { center, tenants };
}

/** Landmark slugs already represented by a headed tenant-group marker. */
export function getTenantGroupCenterSlugs(
  groups: Array<{ address: string; tenants: Tenant[] }>
): Set<string> {
  const slugs = new Set<string>();
  for (const group of groups) {
    const resolved = resolveTenantGroupCenter(group);
    if (resolved) slugs.add(resolved.center.slug);
  }
  return slugs;
}
