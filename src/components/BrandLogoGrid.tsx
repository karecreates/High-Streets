import { useEffect, useMemo, useState } from "react";
import { loadBrandfetchDarkLogo } from "../utils/logoProvider";

export interface BrandLogoItem {
  name: string;
  /** Verified brand domain for Brandfetch dark logo. */
  domain?: string;
}

interface BrandLogoGridProps {
  brands: BrandLogoItem[];
  /** Max logos after filtering to ones that load a Brandfetch dark logo. */
  limit?: number;
}

interface ResolvedBrand {
  name: string;
  src: string;
}

/**
 * Notable Brands — Brandfetch dark wordmarks only.
 * No logo.dev, no icons, no lettermarks. Skips failures and keeps looking.
 */
export function BrandLogoGrid({ brands, limit = 10 }: BrandLogoGridProps) {
  const [resolved, setResolved] = useState<ResolvedBrand[]>([]);
  const [loading, setLoading] = useState(true);

  const brandsKey = useMemo(
    () => brands.map((b) => `${b.domain ?? ""}|${b.name}`).join("\n"),
    [brands]
  );

  const stableBrands = useMemo(() => {
    const out: BrandLogoItem[] = [];
    const seen = new Set<string>();
    for (const brand of brands) {
      if (!brand.domain) continue;
      const key = brand.domain.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(brand);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandsKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setResolved([]);

    (async () => {
      const unique: ResolvedBrand[] = [];
      const seenSrc = new Set<string>();

      for (const brand of stableBrands) {
        if (cancelled || unique.length >= limit) break;
        if (!brand.domain) continue;

        const img = await loadBrandfetchDarkLogo(brand.domain, { size: 220 });
        if (!img?.src || seenSrc.has(img.src)) continue;

        seenSrc.add(img.src);
        unique.push({ name: brand.name, src: img.src });
        if (!cancelled) setResolved([...unique]);
      }

      if (!cancelled) {
        setResolved(unique);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [stableBrands, limit]);

  if (loading && resolved.length === 0) {
    return (
      <div className="brand-grid brand-grid--large brand-grid--loading" aria-busy>
        {Array.from({ length: limit }, (_, i) => (
          <div key={i} className="brand-grid__cell brand-grid__cell--skeleton" />
        ))}
      </div>
    );
  }

  if (resolved.length === 0) return null;

  return (
    <div className="brand-grid brand-grid--large">
      {resolved.map((brand, index) => (
        <div
          key={`${brand.name}-${index}`}
          className="brand-grid__cell"
          style={{ animationDelay: `${index * 55}ms` }}
        >
          <img src={brand.src} alt={brand.name} loading="lazy" />
        </div>
      ))}
    </div>
  );
}
