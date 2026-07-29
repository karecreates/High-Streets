import { useEffect, useMemo, useState } from "react";
import type { Tenant } from "../types/tenant";
import { hasBrandfetchLogoAttribution } from "../utils/logoProvider";
import { isNamedTenant } from "../utils/tenantDisplay";

/**
 * When enabled, keeps only mapped tenants whose Brandfetch type=logo loads.
 * Results stream in as domains resolve so the map updates progressively.
 */
export function useMajorTenantsFilter(
  tenants: Tenant[],
  enabled: boolean
): { tenants: Tenant[]; filtering: boolean; majorCount: number } {
  const [allowedDomains, setAllowedDomains] = useState<Set<string> | null>(
    null
  );
  const [filtering, setFiltering] = useState(false);

  const candidateTenants = useMemo(
    () =>
      tenants.filter(
        (tenant) =>
          tenant.lat != null &&
          tenant.lng != null &&
          isNamedTenant(tenant.tenantName)
      ),
    [tenants]
  );

  const domainsKey = useMemo(() => {
    const domains = new Set<string>();
    for (const tenant of candidateTenants) {
      const domain = tenant.logoDomain?.trim().toLowerCase();
      if (domain) domains.add(domain);
    }
    return [...domains].sort().join("\n");
  }, [candidateTenants]);

  useEffect(() => {
    if (!enabled) {
      setAllowedDomains(null);
      setFiltering(false);
      return;
    }

    let cancelled = false;
    const domains = domainsKey ? domainsKey.split("\n") : [];
    setFiltering(true);
    setAllowedDomains(new Set());

    (async () => {
      const allowed = new Set<string>();
      await Promise.all(
        domains.map(async (domain) => {
          const ok = await hasBrandfetchLogoAttribution(domain);
          if (cancelled || !ok) return;
          allowed.add(domain);
          setAllowedDomains(new Set(allowed));
        })
      );
      if (!cancelled) {
        setAllowedDomains(new Set(allowed));
        setFiltering(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, domainsKey]);

  const filtered = useMemo(() => {
    if (!enabled || !allowedDomains) return candidateTenants;
    return candidateTenants.filter((tenant) => {
      const domain = tenant.logoDomain?.trim().toLowerCase();
      return Boolean(domain && allowedDomains.has(domain));
    });
  }, [allowedDomains, candidateTenants, enabled]);

  return {
    tenants: enabled ? filtered : tenants,
    filtering: enabled && filtering,
    majorCount: filtered.length,
  };
}
