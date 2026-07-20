import type { Tenant, TenantsDataset } from "../types/tenant";
import { isNamedTenant } from "./tenantDisplay";

/** First row in Excel order for this corridor (dataset.tenants order). */
export function getFirstMappedTenantForStreet(
  dataset: TenantsDataset,
  highStreet: string
): Tenant | undefined {
  return dataset.tenants.find(
    (t) =>
      t.highStreet === highStreet &&
      t.lat != null &&
      t.lng != null &&
      isNamedTenant(t.tenantName)
  );
}

export const STREET_FOCUS_ZOOM = 18;
