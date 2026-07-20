import type { Tenant } from "../types/tenant";
import { coordinateKey, dedupeTenants } from "./dedupeTenants";

export interface TenantLocationGroup {
  key: string;
  lat: number;
  lng: number;
  address: string;
  tenants: Tenant[];
}

/** Same geocoded point → one marker (address text may vary per CoStar row). */
export function locationGroupKey(tenant: Tenant): string | null {
  if (tenant.lat == null || tenant.lng == null) return null;
  return coordinateKey(tenant.lat, tenant.lng, 6);
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

  return [...map.values()];
}
