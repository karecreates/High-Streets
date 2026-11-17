import {
  normalizeTenantName,
  type MajorTenantLayoutOverride,
} from "./majorTenants";

/** Manual Text Only callout placements for stubborn clusters. */
export const TEXT_ONLY_LAYOUT_OVERRIDES_BY_SLUG: Record<
  string,
  Record<string, MajorTenantLayoutOverride>
> = {
  "third-street-promenade": {
    skechers: { placement: "above", stemHeight: 16 },
    "aldo shoes": { placement: "right", stemHeight: 8 },
    puzzlezoo: { placement: "above", stemHeight: 16 },
  },
};

export function getTextOnlyLayoutOverride(
  slug: string | undefined,
  tenantNames: readonly string[]
): MajorTenantLayoutOverride | null {
  if (!slug) return null;
  const byName = TEXT_ONLY_LAYOUT_OVERRIDES_BY_SLUG[slug];
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
