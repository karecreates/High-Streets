/** Tenants without a real name are hidden from the map. */
export function isNamedTenant(tenantName: string): boolean {
  const normalized = tenantName.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === "(unnamed tenant)") return false;
  if (normalized === "unnamed tenant") return false;
  if (normalized === "unnamed") return false;
  if (normalized === "unamed") return false;
  return true;
}
