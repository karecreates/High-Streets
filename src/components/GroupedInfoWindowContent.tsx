import type { Tenant } from "../types/tenant";
import { InfoWindowContent } from "./InfoWindowContent";

interface GroupedInfoWindowContentProps {
  tenants: Tenant[];
}

export function GroupedInfoWindowContent({
  tenants,
}: GroupedInfoWindowContentProps) {
  if (tenants.length === 1) {
    return <InfoWindowContent tenant={tenants[0]} />;
  }

  return (
    <div className="info-window info-window--group">
      <p className="info-window__group-label">
        {tenants.length} tenants at this address
      </p>
      <ul className="info-window__group-list">
        {tenants.map((tenant) => (
          <li key={tenant.id} className="info-window__group-item">
            <InfoWindowContent tenant={tenant} />
          </li>
        ))}
      </ul>
    </div>
  );
}
