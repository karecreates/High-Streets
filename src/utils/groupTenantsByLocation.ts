import type { Tenant } from "../types/tenant";
import {
  coordinateKey,
  dedupeTenants,
  tenantsShareBrand,
} from "./dedupeTenants";

export interface TenantLocationGroup {
  key: string;
  lat: number;
  lng: number;
  address: string;
  tenants: Tenant[];
}

/**
 * Adjacent storefronts of the same brand (e.g. Mohawk General + Mohawk Man)
 * often geocode a few meters apart and would otherwise show as duplicate logos.
 * Farther repeats (e.g. two Kitsons ~66m apart) stay as separate pins.
 */
const SAME_BRAND_MERGE_METERS = 40;

/** Same geocoded point → one marker (address text may vary per CoStar row). */
export function locationGroupKey(tenant: Tenant): string | null {
  if (tenant.lat == null || tenant.lng == null) return null;
  return coordinateKey(tenant.lat, tenant.lng, 6);
}

function metersBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function groupsShareBrand(
  a: TenantLocationGroup,
  b: TenantLocationGroup
): boolean {
  for (const ta of a.tenants) {
    for (const tb of b.tenants) {
      if (tenantsShareBrand(ta, tb)) return true;
    }
  }
  return false;
}

function sameHighStreet(
  a: TenantLocationGroup,
  b: TenantLocationGroup
): boolean {
  const streetA = a.tenants[0]?.highStreet?.trim().toLowerCase() ?? "";
  const streetB = b.tenants[0]?.highStreet?.trim().toLowerCase() ?? "";
  return Boolean(streetA) && streetA === streetB;
}

/**
 * Collapse nearby same-brand pin groups so one logo callout represents the
 * cluster (info window still lists every unique tenant after brand dedupe).
 */
function mergeNearbySameBrandGroups(
  groups: TenantLocationGroup[]
): TenantLocationGroup[] {
  const merged: TenantLocationGroup[] = [];

  for (const group of groups) {
    const target = merged.find(
      (existing) =>
        sameHighStreet(existing, group) &&
        metersBetween(existing, group) <= SAME_BRAND_MERGE_METERS &&
        groupsShareBrand(existing, group)
    );

    if (!target) {
      merged.push({
        ...group,
        tenants: [...group.tenants],
      });
      continue;
    }

    target.tenants.push(...group.tenants);
    const n = target.tenants.length;
    target.lat =
      target.tenants.reduce((sum, t) => sum + (t.lat ?? 0), 0) / n;
    target.lng =
      target.tenants.reduce((sum, t) => sum + (t.lng ?? 0), 0) / n;
    target.key = coordinateKey(target.lat, target.lng, 6);
    // Prefer the shorter / primary address label when merging.
    if (
      group.address &&
      (!target.address || group.address.length < target.address.length)
    ) {
      target.address = group.address;
    }
  }

  for (const group of merged) {
    group.tenants = dedupeTenants(group.tenants);
  }

  return merged;
}

export function groupTenantsByLocation(tenants: Tenant[]): TenantLocationGroup[] {
  const map = new Map<string, TenantLocationGroup>();

  for (const tenant of tenants) {
    const key = locationGroupKey(tenant);
    if (!key) continue;

    const existing = map.get(key);
    if (existing) {
      existing.tenants.push(tenant);
      continue;
    }

    map.set(key, {
      key,
      lat: tenant.lat!,
      lng: tenant.lng!,
      address: tenant.address,
      tenants: [tenant],
    });
  }

  for (const group of map.values()) {
    group.tenants = dedupeTenants(group.tenants);
  }

  return mergeNearbySameBrandGroups([...map.values()]);
}

/**
 * One logo pin per tenant. Used for major-tenant deconflict so co-located
 * brands (e.g. Alo + Vans) can sit above/below the same anchor cleanly.
 */
export function splitTenantGroupsForDeconflict(
  groups: TenantLocationGroup[]
): TenantLocationGroup[] {
  return groups.flatMap((group) => {
    if (group.tenants.length <= 1) return [group];
    return group.tenants.map((tenant, index) => ({
      key: `${group.key}::${tenant.id || index}`,
      lat: group.lat,
      lng: group.lng,
      address: tenant.address || group.address,
      tenants: [tenant],
    }));
  });
}
