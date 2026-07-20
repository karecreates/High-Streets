import type { Tenant } from "../types/tenant";
import { TenantLogo } from "./TenantLogo";

interface InfoWindowContentProps {
  tenant: Tenant;
}

export function InfoWindowContent({ tenant }: InfoWindowContentProps) {
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
        {tenant.costarUrl && (
          <>
            <dt>CoStar</dt>
            <dd>
              <a
                href={tenant.costarUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View property in CoStar
              </a>
            </dd>
          </>
        )}
      </dl>
    </article>
  );
}
