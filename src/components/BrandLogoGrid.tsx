import { useEffect, useMemo, useState } from "react";
import { loadBrandfetchDarkLogo } from "../utils/logoProvider";
import { getLocalLogoUrl } from "../utils/logoRouteOverrides";
import { beginPendingAsset } from "../utils/pendingAssetWork";

function isErewhonDomain(domain: string): boolean {
  const clean = domain.trim().replace(/^www\./i, "").toLowerCase();
  return clean === "erewhon.com" || clean === "erewhonmarket.com";
}

export interface BrandLogoItem {
  name: string;
  /** Verified brand domain for Brandfetch dark logo. */
  domain?: string;
  /** Local logo asset that bypasses the Brandfetch lookup. */
  src?: string;
}

interface BrandLogoGridProps {
  brands: BrandLogoItem[];
  /** Max logos after filtering to ones that load a Brandfetch dark logo. */
  limit?: number;
  /**
   * Booklet capture: skip the skeleton and decode logos immediately.
   * Still uses the same skip-on-failure path as the live page — dumping
   * Brandfetch URLs left empty cells when a curated domain 404'd.
   */
  eager?: boolean;
  /** Reports how many logos resolved, so callers can hide an empty card. */
  onResolvedCount?: (count: number) => void;
}

interface ResolvedBrand {
  name: string;
  src: string;
}

/**
 * Notable Brands — Brandfetch dark wordmarks, plus the Erewhon local
 * wordmark. No logo.dev, no icons, no lettermarks. Skips failures.
 */
export function BrandLogoGrid({
  brands,
  limit = 10,
  eager = false,
  onResolvedCount,
}: BrandLogoGridProps) {
  const brandsKey = useMemo(
    () => brands.map((b) => `${b.domain ?? ""}|${b.name}|${b.src ?? ""}`).join("\n"),
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

  const [resolved, setResolved] = useState<ResolvedBrand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setResolved([]);
    const finishPendingWork = beginPendingAsset();

    (async () => {
      const unique: ResolvedBrand[] = [];
      const seenSrc = new Set<string>();

      for (const brand of stableBrands) {
        if (cancelled || unique.length >= limit) break;
        if (!brand.domain) continue;

        const localSrc =
          brand.src ??
          (isErewhonDomain(brand.domain) ? getLocalLogoUrl(brand.domain) : null);
        const src =
          localSrc ??
          (await loadBrandfetchDarkLogo(brand.domain, { size: 220 }))?.src;
        if (!src || seenSrc.has(src)) continue;

        seenSrc.add(src);
        unique.push({ name: brand.name, src });
        if (!cancelled) setResolved([...unique]);
      }

      if (!cancelled) {
        setResolved(unique);
        setLoading(false);
        onResolvedCount?.(unique.length);
      }
      finishPendingWork();
    })();

    return () => {
      cancelled = true;
      finishPendingWork();
    };
  }, [stableBrands, limit, onResolvedCount]);

  if (loading && resolved.length === 0 && !eager) {
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
          <img
            src={brand.src}
            alt={brand.name}
            loading={eager ? "eager" : "lazy"}
            decoding={eager ? "sync" : "async"}
          />
        </div>
      ))}
    </div>
  );
}
