/** First letter shown when a tenant has no logo image. */
export function getTenantInitial(tenantName: string): string {
  const trimmed = tenantName.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}
