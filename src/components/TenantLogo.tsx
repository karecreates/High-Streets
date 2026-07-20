import { useState } from "react";
import type { Tenant } from "../types/tenant";
import { getLogoDevImageUrl } from "../utils/logoDev";
import { getTenantInitial } from "../utils/tenantInitial";

interface TenantLogoProps {
  tenant: Tenant;
  className?: string;
}

export function TenantLogo({ tenant, className = "info-window__logo" }: TenantLogoProps) {
  const [failed, setFailed] = useState(false);
  const initial = getTenantInitial(tenant.tenantName);
  // Only show an image when a verified brand domain resolved for this tenant;
  // otherwise show the initial (the full name sits next to it).
  const logoUrl = !failed && getLogoDevImageUrl(tenant.logoDomain);

  if (!logoUrl) {
    return (
      <div className={`${className} info-window__logo--fallback`} aria-hidden>
        {initial}
      </div>
    );
  }

  if (failed) {
    return (
      <div className={`${className} info-window__logo--fallback`} aria-hidden>
        {initial}
      </div>
    );
  }

  return (
    <img
      className={className}
      src={logoUrl}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
