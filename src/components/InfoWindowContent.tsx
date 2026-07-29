import type { Tenant } from "../types/tenant";
import { TenantLogo } from "./TenantLogo";
import { isUsableBrandLogoDomain } from "../utils/logoDev";

interface InfoWindowContentProps {
  tenant: Tenant;
}

function tenantWebsite(tenant: Tenant): string | null {
  const candidates = [tenant.logoDomain, tenant.domain];
  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) continue;
    const host = value
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0];
    // Never surface Instagram/etc. as the tenant "website" when it's only a
    // social placeholder — those are not brand sites.
    if (host && isUsableBrandLogoDomain(host)) return host;
  }
  return null;
}

export function InfoWindowContent({ tenant }: InfoWindowContentProps) {
  const websiteDomain = tenantWebsite(tenant);

  return (
    <article className="info-window">
      <header className="info-window__header">
        <TenantLogo tenant={tenant} />
        <div>
          <h2 className="info-window__title">{tenant.tenantName}</h2>
          {tenant.unitStatus && (
            <span className="info-window__badge">{tenant.unitStatus}</span>
          )}
        </div>
      </header>

      <dl className="info-window__details">
        {tenant.address && (
          <>
            <dt>Address</dt>
            <dd>
              {tenant.address}
              {tenant.suite ? ` · ${tenant.suite}` : ""}
            </dd>
          </>
        )}
        {tenant.highStreet && (
          <>
            <dt>High street</dt>
            <dd>{tenant.highStreet.replace(/^Street - /, "")}</dd>
          </>
        )}
        {websiteDomain && (
          <>
            <dt>Website</dt>
            <dd>
              <a
                href={`https://${websiteDomain}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {websiteDomain}
              </a>
            </dd>
          </>
        )}
      </dl>
    </article>
  );
}
