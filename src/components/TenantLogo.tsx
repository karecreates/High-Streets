import { useEffect, useState } from "react";
import type { Tenant } from "../types/tenant";
import { useLogoProvider } from "../hooks/useLogoProvider";
import { loadBrandLogoImage } from "../utils/logoProvider";
import { getTenantInitial } from "../utils/tenantInitial";

interface TenantLogoProps {
  tenant: Tenant;
  className?: string;
}

export function TenantLogo({
  tenant,
  className = "info-window__logo",
}: TenantLogoProps) {
  const [provider] = useLogoProvider();
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const initial = getTenantInitial(tenant.tenantName);
  const sourceKey = `${provider}:${tenant.logoDomain ?? ""}:${tenant.tenantName}`;

  useEffect(() => {
    let cancelled = false;
    setLogoSrc(null);
    setFailed(false);

    (async () => {
      const img = await loadBrandLogoImage(
        tenant.logoDomain,
        tenant.tenantName
      );
      if (cancelled) return;
      if (img?.src) setLogoSrc(img.src);
      else setFailed(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [sourceKey, tenant.logoDomain]);

  if (!logoSrc || failed) {
    return (
      <div className={`${className} lettermark`} aria-hidden>
        {initial}
      </div>
    );
  }

  return (
    <img
      key={sourceKey}
      className={className}
      src={logoSrc}
      alt=""
      referrerPolicy={
        provider === "brandfetch"
          ? "strict-origin-when-cross-origin"
          : "no-referrer"
      }
      onError={() => setFailed(true)}
    />
  );
}
