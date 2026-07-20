import { useEffect, useState } from "react";
import { getLogoDevImageUrl, getLogoDevNameImageUrl } from "../utils/logoDev";

export interface BrandLogoItem {
  name: string;
  /** Verified brand domain — preferred (exact logo). */
  domain?: string;
}

interface BrandLogoGridProps {
  brands: BrandLogoItem[];
}

function BrandLogoCell({ brand, index }: { brand: BrandLogoItem; index: number }) {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [showName, setShowName] = useState(false);

  useEffect(() => {
    // Prefer the verified domain (exact); fall back to name search only when
    // no domain is provided (curated lists).
    const url = brand.domain
      ? getLogoDevImageUrl(brand.domain)
      : getLogoDevNameImageUrl(brand.name);
    if (!url) {
      setShowName(true);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setLogoSrc(url);
    img.onerror = () => setShowName(true);
    img.src = url;
  }, [brand.domain, brand.name]);

  return (
    <div
      className="brand-grid__cell"
      style={{ animationDelay: `${index * 55}ms` }}
    >
      {logoSrc && !showName ? (
        <img src={logoSrc} alt={brand.name} loading="lazy" />
      ) : (
        <span className="brand-grid__name">{brand.name}</span>
      )}
    </div>
  );
}

export function BrandLogoGrid({ brands }: BrandLogoGridProps) {
  return (
    <div className="brand-grid">
      {brands.map((brand, index) => (
        <BrandLogoCell key={brand.name} brand={brand} index={index} />
      ))}
    </div>
  );
}
