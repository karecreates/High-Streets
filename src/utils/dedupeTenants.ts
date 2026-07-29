import type { Tenant } from "../types/tenant";

function normalizePart(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeBrandName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s*&\s*/g, " and ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDomain(domain: string): string {
  return domain
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .toLowerCase();
}

export function tenantsShareBrand(a: Tenant, b: Tenant): boolean {
  // Same verified brand domain → same brand (strongest signal).
  const domainA = normalizeDomain(a.logoDomain || a.domain);
  const domainB = normalizeDomain(b.logoDomain || b.domain);
  if (domainA && domainB && domainA === domainB) return true;

  const nameA = normalizeBrandName(a.tenantName);
  const nameB = normalizeBrandName(b.tenantName);
  if (nameA === nameB) return true;
  if (nameA.startsWith(`${nameB} `) || nameB.startsWith(`${nameA} `)) {
    return true;
  }

  return false;
}

function dedupeTenantsByBrand(tenants: Tenant[]): Tenant[] {
  const kept: Tenant[] = [];

  for (const tenant of tenants) {
    const matchIndex = kept.findIndex((existing) =>
      tenantsShareBrand(tenant, existing)
    );
    if (matchIndex === -1) {
      kept.push(tenant);
      continue;
    }
    if (tenant.tenantName.length < kept[matchIndex].tenantName.length) {
      kept[matchIndex] = tenant;
    }
  }

  return kept;
}

export function coordinateKey(lat: number, lng: number, precision = 5): string {
  return `${lat.toFixed(precision)}|${lng.toFixed(precision)}`;
}

/**
 * Duplicate CoStar rows often share geocoded coordinates but differ in
 * address spelling (e.g. "1349-1357 … Venice" vs "1349 … Los Angeles").
 */
export function tenantIdentityKey(tenant: Tenant): string {
  const name = normalizePart(tenant.tenantName);
  const suite = normalizePart(tenant.suite ?? "");
  const street = normalizePart(tenant.highStreet ?? "");
  const location =
    tenant.lat != null && tenant.lng != null
      ? coordinateKey(tenant.lat, tenant.lng)
      : `addr:${normalizePart(tenant.address ?? "")}`;
  return `${street}|${location}|${name}|${suite}`;
}

/** Keeps the first row in source order when the export repeats a tenant. */
export function dedupeTenants(tenants: Tenant[]): Tenant[] {
  const seen = new Set<string>();
  const unique: Tenant[] = [];

  for (const tenant of tenants) {
    const key = tenantIdentityKey(tenant);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(tenant);
  }

  return dedupeTenantsByBrand(unique);
}
