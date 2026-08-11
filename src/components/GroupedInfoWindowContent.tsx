import type { Tenant } from "../types/tenant";
import { resolveTenantGroupCenter } from "../utils/tenantGroupCenter";
import { InfoWindowContent } from "./InfoWindowContent";

interface GroupedInfoWindowContentProps {
  tenants: Tenant[];
  address?: string;
}

export function GroupedInfoWindowContent({
  tenants,
  address = "",
}: GroupedInfoWindowContentProps) {
  const centerGroup = resolveTenantGroupCenter({ address, tenants });
  const displayTenants = centerGroup?.tenants ?? tenants;

  if (displayTenants.length === 1 && !centerGroup) {
    return <InfoWindowContent tenant={displayTenants[0]} />;
  }

  return (
    <div className="info-window info-window--group">
      {centerGroup ? (
        <header className="info-window__center-header">
          <img
            className="info-window__center-logo"
            src={centerGroup.center.logo}
            alt={centerGroup.center.name}
          />
          <p className="info-window__group-label">
            {displayTenants.length} tenants at {centerGroup.center.name}
          </p>
        </header>
      ) : (
        <p className="info-window__group-label">
          {displayTenants.length} tenants at this address
        </p>
      )}
      <ul className="info-window__group-list">
        {displayTenants.map((tenant) => (
          <li key={tenant.id} className="info-window__group-item">
            <InfoWindowContent tenant={tenant} />
          </li>
        ))}
      </ul>
    </div>
  );
}
