import { useEffect, useMemo, useState } from "react";
import { isMajorTenantAllowed } from "../data/majorTenants";
import type { Tenant } from "../types/tenant";
import { hasBrandfetchLogoAttribution } from "../utils/logoProvider";
import { isNamedTenant } from "../utils/tenantDisplay";

export interface MajorTenantsFilterOptions {
  /**
   * When set, filter by exact tenant name (case-insensitive) instead of
   * the Brandfetch logo heuristic.
   */
  allowlist?: ReadonlySet<string> | null;
  /** Corridor slug — used for address exclusions on curated allowlists. */
  slug?: string;
}

/**
 * When enabled, keeps only mapped "major" tenants.
 * - With an allowlist: exact name match (curated corridors like Abbot Kinney).
 * - Otherwise: Brandfetch type=logo attribution (streams in as domains resolve).
 */
export function useMajorTenantsFilter(
  tenants: Tenant[],
  enabled: boolean,
  options?: MajorTenantsFilterOptions
): { tenants: Tenant[]; filtering: boolean; majorCount: number } {
  const allowlist = options?.allowlist ?? null;
  const slug = options?.slug;
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
    if (allowlist) return "";
    const domains = new Set<string>();
    for (const tenant of candidateTenants) {
      const domain = tenant.logoDomain?.trim().toLowerCase();
      if (domain) domains.add(domain);
    }
    return [...domains].sort().join("\n");
  }, [allowlist, candidateTenants]);

  useEffect(() => {
    if (!enabled || allowlist) {
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
  }, [allowlist, enabled, domainsKey]);

  const filtered = useMemo(() => {
    if (!enabled) return candidateTenants;

    if (allowlist) {
      return candidateTenants.filter((tenant) =>
        isMajorTenantAllowed(slug, tenant, allowlist)
      );
    }

    if (!allowedDomains) return candidateTenants;
    return candidateTenants.filter((tenant) => {
      const domain = tenant.logoDomain?.trim().toLowerCase();
      return Boolean(domain && allowedDomains.has(domain));
    });
  }, [allowedDomains, allowlist, candidateTenants, enabled, slug]);

  return {
    tenants: enabled ? filtered : tenants,
    filtering: enabled && !allowlist && filtering,
    majorCount: filtered.length,
  };
}
