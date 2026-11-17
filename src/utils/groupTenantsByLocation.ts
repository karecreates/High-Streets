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
  groups: TenantLocationGroup[],
  keepGrouped?: (group: TenantLocationGroup) => boolean
): TenantLocationGroup[] {
  return groups.flatMap((group) => {
    if (group.tenants.length <= 1 || keepGrouped?.(group)) return [group];
    return group.tenants.map((tenant, index) => ({
      key: `${group.key}::${tenant.id || index}`,
      lat: group.lat,
      lng: group.lng,
      address: tenant.address || group.address,
      tenants: [tenant],
    }));
  });
}

/**
 * Fold named neighbours into the group that holds `anchor` (anchor keeps its
 * lat/lng). Used for curated major-tenant corridors where storefronts a few
 * metres apart read better as one stacked callout.
 */
export function mergeTenantGroupsByName(
  groups: TenantLocationGroup[],
  merges: ReadonlyArray<{ anchor: string; members: readonly string[] }>,
  normalize: (name: string) => string = (name) => name.trim().toLowerCase()
): TenantLocationGroup[] {
  if (!merges.length) return groups;
  const result = groups.map((group) => ({
    ...group,
    tenants: [...group.tenants],
  }));
  for (const merge of merges) {
    const anchorName = normalize(merge.anchor);
    const target = result.find((group) =>
      group.tenants.some((t) => normalize(t.tenantName) === anchorName)
    );
    if (!target) continue;
    const memberNames = new Set(merge.members.map(normalize));
    for (const group of result) {
      if (group === target) continue;
      const moving = group.tenants.filter((t) =>
        memberNames.has(normalize(t.tenantName))
      );
      if (!moving.length) continue;
      group.tenants = group.tenants.filter((t) => !moving.includes(t));
      target.tenants.push(...moving);
    }
  }
  return result.filter((group) => group.tenants.length > 0);
}

/**
 * Give co-geocoded storefronts distinct anchors along a bearing so logos
 * don't triangulate from a single lat/lng.
 */
export function spreadCoLocatedAnchors(
  groups: TenantLocationGroup[],
  options?: { bearingDeg?: number; spacingMeters?: number }
): TenantLocationGroup[] {
  const bearingDeg = options?.bearingDeg ?? -40;
  const spacingMeters = options?.spacingMeters ?? 11;
  const rad = (bearingDeg * Math.PI) / 180;
  const metersToLat = 1 / 111_320;

  const clusters = new Map<string, TenantLocationGroup[]>();
  for (const group of groups) {
    const key = `${group.lat.toFixed(6)},${group.lng.toFixed(6)}`;
    const list = clusters.get(key);
    if (list) list.push(group);
    else clusters.set(key, [group]);
  }

  const result: TenantLocationGroup[] = [];
  for (const cluster of clusters.values()) {
    if (cluster.length === 1) {
      result.push(cluster[0]);
      continue;
    }
    const mid = (cluster.length - 1) / 2;
    const cosLat = Math.cos((cluster[0].lat * Math.PI) / 180);
    cluster.forEach((group, index) => {
      const dist = (index - mid) * spacingMeters;
      result.push({
        ...group,
        lat: group.lat + dist * Math.cos(rad) * metersToLat,
        lng: group.lng + (dist * Math.sin(rad) * metersToLat) / cosLat,
      });
    });
  }
  return result;
}
