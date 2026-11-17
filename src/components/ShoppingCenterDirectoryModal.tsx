import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type {
  ShoppingCenter,
  ShoppingCenterTenant,
  ShoppingCenterVacancy,
} from "../data/shoppingCenters";
import { MajorTenantsToggle } from "./MajorTenantsToggle";
import { useLogoProvider } from "../hooks/useLogoProvider";
import { loadBrandLogoImage } from "../utils/logoProvider";
import { getLogoRouteOverride } from "../utils/logoRouteOverrides";
import { pickNotableBrandsFromCenterTenants } from "../utils/pickNotableBrands";
import {
  getShoppingCenterDirectoryAllowlist,
  normalizeTenantName,
} from "../data/majorTenants";

/** Below this the printed logos stop being readable at arm's length. */
const MIN_PDF_GRID_SCALE = 0.7;
/** Logo lookups probed per center during a booklet export. */
const PDF_MAX_PROBED_TENANTS = 96;

/**
 * Vertical room the logo grid has left on the printed page.
 *
 * Measured against the page frame rather than the grid's own scroll container:
 * the PDF panel shrink-wraps its content, so asking the container how tall it is
 * would just echo the grid's height back.
 */
function availableGridHeight(
  root: HTMLElement | null,
  panel: HTMLElement | null,
  grid: HTMLElement
): number {
  if (!root || !panel) return 0;
  const rootStyle = window.getComputedStyle(root);
  const panelStyle = window.getComputedStyle(panel);
  const limit =
    root.getBoundingClientRect().bottom -
    parseFloat(rootStyle.paddingBottom || "0") -
    parseFloat(panelStyle.paddingBottom || "0");
  return limit - grid.getBoundingClientRect().top;
}

function countGridColumns(grid: HTMLElement): number {
  const template = window.getComputedStyle(grid).gridTemplateColumns;
  const columns = template.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, columns);
}

function compareTenantsByName(a: ShoppingCenterTenant, b: ShoppingCenterTenant) {
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

/** Split long center names onto two lines for the directory header. */
function formatCenterTitle(name: string) {
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return name;
  if (words.length >= 3) {
    return (
      <>
        {words.slice(0, -1).join(" ")}
        <br />
        {words[words.length - 1]}
      </>
    );
  }
  return (
    <>
      {words[0]}
      <br />
      {words[1]}
    </>
  );
}

/** Occupied first (A–Z), then coming soon (A–Z). */
function sortDirectoryTenants(tenants: ShoppingCenterTenant[]) {
  const occupied: ShoppingCenterTenant[] = [];
  const comingSoon: ShoppingCenterTenant[] = [];
  for (const tenant of tenants) {
    if (tenant.comingSoon) comingSoon.push(tenant);
    else occupied.push(tenant);
  }
  occupied.sort(compareTenantsByName);
  comingSoon.sort(compareTenantsByName);
  return [...occupied, ...comingSoon];
}

function tenantHasImmediateLogoCandidate(tenant: ShoppingCenterTenant) {
  if (!tenant.logoDomain || !tenant.hasLogo) return false;
  return getLogoRouteOverride(tenant.logoDomain) !== "text";
}

interface ShoppingCenterDirectoryModalProps {
  center: ShoppingCenter;
  onClose: () => void;
  /** Booklet export: no controls, eager images, grid scaled to fit the page. */
  pdfMode?: boolean;
  /** Booklet export: fires once logo filtering and grid fitting are done. */
  onLogosSettled?: () => void;
}

function DirectoryLogoCell({
  tenant,
  directoryHref,
  eager = false,
}: {
  tenant: ShoppingCenterTenant;
  directoryHref?: string;
  /** Booklet export: lazy images below the fold never decode before capture. */
  eager?: boolean;
}) {
  const [provider] = useLogoProvider();
  const forceText =
    Boolean(tenant.logoDomain) &&
    getLogoRouteOverride(tenant.logoDomain) === "text";
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [showName, setShowName] = useState(forceText);
  const href = directoryHref ?? tenant.website;

  useEffect(() => {
    let cancelled = false;
    setLogoSrc(null);
    setShowName(forceText);

    if (forceText) return;

    (async () => {
      const img = await loadBrandLogoImage(tenant.logoDomain, tenant.name);
      if (cancelled) return;
      if (img?.src) {
        setLogoSrc(img.src);
        setShowName(false);
      } else {
        setLogoSrc(null);
        setShowName(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tenant.logoDomain, tenant.name, provider, forceText]);

  const content = (
    <>
      {showName ? (
        <span className="shopping-center-directory__name">{tenant.name}</span>
      ) : logoSrc ? (
        <img src={logoSrc} alt="" loading={eager ? "eager" : "lazy"} />
      ) : null}
      {tenant.comingSoon ? (
        <span className="shopping-center-directory__coming-soon">
          Coming Soon · {tenant.comingSoon}
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`shopping-center-directory__cell${
          tenant.comingSoon ? " shopping-center-directory__cell--coming-soon" : ""
        }`}
        title={
          tenant.comingSoon
            ? `${tenant.name} · Coming Soon · ${tenant.comingSoon}`
            : showName
              ? tenant.name
              : undefined
        }
        aria-label={
          tenant.comingSoon
            ? `${tenant.name}, coming soon ${tenant.comingSoon}`
            : tenant.name
        }
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className={`shopping-center-directory__cell${
        tenant.comingSoon ? " shopping-center-directory__cell--coming-soon" : ""
      }`}
      title={
        tenant.comingSoon
          ? `${tenant.name} · Coming Soon · ${tenant.comingSoon}`
          : showName
            ? tenant.name
            : undefined
      }
      aria-label={
        tenant.comingSoon
          ? `${tenant.name}, coming soon ${tenant.comingSoon}`
          : tenant.name
      }
    >
      {content}
    </div>
  );
}

function vacancySquareFootageLabel(spaceSf: string | null): string {
  const raw = spaceSf?.trim() ?? "";
  if (!raw) return "Square footage TBD";
  const sqft = Number(raw.replace(/,/g, "").replace(/\s*sf\b/i, ""));
  if (!Number.isFinite(sqft) || sqft <= 0) return "Square footage TBD";
  return `${raw.replace(/\s*sf\b/i, "").trim()} SF`;
}

function VacancyCard({ vacancy }: { vacancy: ShoppingCenterVacancy }) {
  return (
    <article className="shopping-center-directory__vacancy-card">
      <div className="shopping-center-directory__vacancy-card-top">
        <span className="shopping-center-directory__vacancy-label">
          {vacancy.label.replace(/\s+/g, "\u00A0")}
        </span>
        <span className="shopping-center-directory__vacancy-badge">Vacant</span>
      </div>
      <p className="shopping-center-directory__vacancy-sf">
        {vacancySquareFootageLabel(vacancy.spaceSf)}
      </p>
    </article>
  );
}

function SitePlanLightbox({
  centerName,
  src,
  onClose,
}: {
  centerName: string;
  src: string;
  onClose: () => void;
}) {
  const isPdf = /\.pdf(?:$|\?)/i.test(src);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  return (
    <div
      className="shopping-center-site-plan"
      role="dialog"
      aria-modal="true"
      aria-label={`${centerName} site plan`}
      onClick={onClose}
    >
      <div
        className="shopping-center-site-plan__panel"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="shopping-center-site-plan__header">
          <h3>{centerName} · Site Plan</h3>
          <div className="shopping-center-site-plan__header-actions">
            <a
              className="shopping-center-site-plan__open"
              href={src}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in new tab
            </a>
            <button
              type="button"
              className="shopping-center-directory__close"
              onClick={onClose}
              aria-label="Close site plan"
            >
              ×
            </button>
          </div>
        </header>
        <div
          className={`shopping-center-site-plan__body${
            isPdf ? " shopping-center-site-plan__body--pdf" : ""
          }`}
        >
          {isPdf ? (
            <iframe
              className="shopping-center-site-plan__pdf"
              src={src}
              title={`${centerName} site plan`}
            />
          ) : (
            <img src={src} alt={`${centerName} site plan`} />
          )}
        </div>
      </div>
    </div>
  );
}

export function ShoppingCenterDirectoryModal({
  center,
  onClose,
  pdfMode = false,
  onLogosSettled,
}: ShoppingCenterDirectoryModalProps) {
  const hasVacancies = !pdfMode && center.vacancies.length > 0;
  const [sitePlanOpen, setSitePlanOpen] = useState(false);
  const majorTenantAllowlist = useMemo(
    () => getShoppingCenterDirectoryAllowlist(center.slug),
    [center.slug]
  );
  /** Directory opens on Major Tenants (curated allowlist or resolved logos). */
  const [majorTenantsOnly, setMajorTenantsOnly] = useState(true);
  const [resolvedLogoDomains, setResolvedLogoDomains] = useState<Set<string>>(
    () => new Set()
  );
  const [filteringLogos, setFilteringLogos] = useState(false);
  const [logoProvider] = useLogoProvider();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridScale, setGridScale] = useState(1);
  const [gridHeight, setGridHeight] = useState(0);
  const [gridFitted, setGridFitted] = useState(!pdfMode);
  const [logoCap, setLogoCap] = useState<number | null>(null);

  const logoCandidateDomainsKey = useMemo(() => {
    const candidates = center.tenants.filter(
      (tenant) => tenantHasImmediateLogoCandidate(tenant) && tenant.logoDomain
    );
    // A printed page shows a bounded number of logos, so probing every tenant
    // of a 250-store center would only burn CDN round-trips.
    const probed =
      pdfMode && candidates.length > PDF_MAX_PROBED_TENANTS
        ? pickNotableBrandsFromCenterTenants(
            candidates,
            PDF_MAX_PROBED_TENANTS
          ).map((brand) => ({ logoDomain: brand.domain }))
        : candidates;
    const domains = new Set(
      probed.map((tenant) => (tenant.logoDomain ?? "").trim().toLowerCase())
    );
    domains.delete("");
    return [...domains].sort().join("\n");
  }, [center.tenants, pdfMode]);

  useEffect(() => {
    if (!majorTenantsOnly || majorTenantAllowlist) {
      setFilteringLogos(false);
      return;
    }

    let cancelled = false;
    const domains = logoCandidateDomainsKey
      ? logoCandidateDomainsKey.split("\n")
      : [];
    setFilteringLogos(true);
    setResolvedLogoDomains(new Set());

    (async () => {
      const allowed = new Set<string>();
      await Promise.all(
        domains.map(async (domain) => {
          // Local overrides resolve immediately without a network round-trip.
          if (getLogoRouteOverride(domain) === "local") {
            if (cancelled) return;
            allowed.add(domain);
            setResolvedLogoDomains(new Set(allowed));
            return;
          }
          const img = await Promise.race([
            loadBrandLogoImage(domain),
            new Promise<null>((resolve) => {
              window.setTimeout(() => resolve(null), 4000);
            }),
          ]);
          if (cancelled || !img?.src || img.src.includes("/beta-logos/")) return;
          allowed.add(domain);
          setResolvedLogoDomains(new Set(allowed));
        })
      );
      if (!cancelled) {
        setResolvedLogoDomains(new Set(allowed));
        setFilteringLogos(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [logoCandidateDomainsKey, logoProvider, majorTenantsOnly, majorTenantAllowlist]);

  const resolvedTenants = useMemo(() => {
    const source = majorTenantsOnly
      ? majorTenantAllowlist
        ? center.tenants.filter((tenant) =>
            majorTenantAllowlist.has(normalizeTenantName(tenant.name))
          )
        : center.tenants.filter((tenant) => {
            if (!tenantHasImmediateLogoCandidate(tenant) || !tenant.logoDomain) {
              return false;
            }
            return resolvedLogoDomains.has(
              tenant.logoDomain.trim().toLowerCase()
            );
          })
      : center.tenants;
    return sortDirectoryTenants(source);
  }, [
    center.tenants,
    majorTenantAllowlist,
    majorTenantsOnly,
    resolvedLogoDomains,
  ]);

  /**
   * Booklet export: a printed page cannot shrink indefinitely, so centers with
   * hundreds of resolved logos keep only the highest-ranked brands that still
   * read at a legible size. The header keeps reporting the true totals.
   */
  const visibleTenants = useMemo(() => {
    if (!pdfMode || logoCap == null || resolvedTenants.length <= logoCap) {
      return resolvedTenants;
    }
    const ranked = pickNotableBrandsFromCenterTenants(resolvedTenants, logoCap);
    const keep = new Set(
      ranked.map((brand) => (brand.domain ?? "").trim().toLowerCase())
    );
    return resolvedTenants.filter((tenant) =>
      keep.has((tenant.logoDomain ?? "").trim().toLowerCase())
    );
  }, [logoCap, pdfMode, resolvedTenants]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !sitePlanOpen) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, sitePlanOpen]);

  /**
   * Booklet export: the directory normally scrolls, but paper cannot. Scale the
   * logo grid down until every tenant fits, then reclaim the layout height the
   * transform leaves behind so the panel does not grow past the page.
   */
  useLayoutEffect(() => {
    if (!pdfMode || filteringLogos) return;

    if (visibleTenants.length === 0) {
      setGridFitted(true);
      return;
    }

    const main = mainRef.current;
    const grid = gridRef.current;
    if (!main || !grid) return;

    let frame = 0;
    const fit = () => {
      const available = availableGridHeight(rootRef.current, panelRef.current, grid);
      const natural = grid.scrollHeight;
      if (natural <= 0 || available <= 0) {
        frame = window.requestAnimationFrame(fit);
        return;
      }

      // Sub-pixel rounding otherwise triggers a pointless 0.99 scale.
      const scale = natural - available > 2 ? available / natural : 1;
      if (scale < MIN_PDF_GRID_SCALE) {
        const columns = countGridColumns(grid);
        const rows = Math.max(1, Math.ceil(visibleTenants.length / columns));
        const rowHeight = natural / rows;
        const fittableRows = Math.max(
          1,
          Math.floor(available / (rowHeight * MIN_PDF_GRID_SCALE))
        );
        const cap = fittableRows * columns;
        // Re-setting the same cap would not re-render, stalling the fit loop.
        if (cap < visibleTenants.length && cap !== logoCap) {
          setLogoCap(cap);
          return;
        }
      }
      setGridScale(scale);
      setGridHeight(natural);
      setGridFitted(true);
    };

    frame = window.requestAnimationFrame(fit);
    return () => window.cancelAnimationFrame(frame);
  }, [filteringLogos, logoCap, pdfMode, visibleTenants.length]);

  useEffect(() => {
    if (!pdfMode || filteringLogos || !gridFitted) return;
    onLogosSettled?.();
  }, [filteringLogos, gridFitted, onLogosSettled, pdfMode]);

  return (
    <div
      className={`shopping-center-directory${
        pdfMode ? " shopping-center-directory--pdf" : ""
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shopping-center-directory-title"
      onClick={pdfMode ? undefined : onClose}
      ref={rootRef}
    >
      <div
        className={`shopping-center-directory__panel${
          hasVacancies ? " shopping-center-directory__panel--with-sidebar" : ""
        }`}
        onClick={(event) => event.stopPropagation()}
        ref={panelRef}
      >
        <header className="shopping-center-directory__header">
          {pdfMode ? null : (
            <div className="shopping-center-directory__header-end">
              <div className="shopping-center-directory__header-actions">
                <MajorTenantsToggle
                  active={majorTenantsOnly}
                  filtering={filteringLogos}
                  onChange={setMajorTenantsOnly}
                />
                {center.sitePlanUrl ? (
                  <a
                    className="shopping-center-directory__site-plan-btn"
                    href={center.sitePlanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View site plan
                  </a>
                ) : center.sitePlan ? (
                  <button
                    type="button"
                    className="shopping-center-directory__site-plan-btn"
                    onClick={() => setSitePlanOpen(true)}
                  >
                    View site plan
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                className="shopping-center-directory__close"
                onClick={onClose}
                aria-label="Close directory"
              >
                ×
              </button>
            </div>
          )}
          {center.logo ? (
            <img
              className="shopping-center-directory__center-logo"
              src={center.logo}
              alt=""
            />
          ) : null}
          <h2
            id="shopping-center-directory-title"
            className={
              center.logo
                ? "shopping-center-directory__title shopping-center-directory__title--corner"
                : "shopping-center-directory__title"
            }
          >
            {formatCenterTitle(center.name)}
          </h2>
          <p className="shopping-center-directory__meta">
            {`${center.tenants.length} total tenant${
              center.tenants.length === 1 ? "" : "s"
            }`}
            {hasVacancies
              ? ` · ${center.vacancies.length} ${
                  center.vacancies.length === 1 ? "vacancy" : "vacancies"
                }`
              : ""}
          </p>
        </header>

        <div className="shopping-center-directory__body">
          {hasVacancies ? (
            <aside
              className="shopping-center-directory__sidebar"
              aria-label="Available vacancies"
            >
              <h3 className="shopping-center-directory__sidebar-title">
                Vacancies
              </h3>
              <div className="shopping-center-directory__vacancy-list">
                {center.vacancies.map((vacancy) => (
                  <VacancyCard
                    key={`${vacancy.label}-${vacancy.spaceLabel ?? vacancy.suite}`}
                    vacancy={vacancy}
                  />
                ))}
              </div>
            </aside>
          ) : null}

          <div className="shopping-center-directory__main" ref={mainRef}>
            <h3 className="shopping-center-directory__section-title">
              {majorTenantsOnly ? "Major Tenants" : "All Tenants"}
            </h3>
            <div
              className="shopping-center-directory__grid"
              ref={gridRef}
              style={
                pdfMode && gridScale < 1
                  ? {
                      transform: `scale(${gridScale})`,
                      transformOrigin: "top left",
                      width: `${100 / gridScale}%`,
                      marginBottom: -(gridHeight * (1 - gridScale)),
                    }
                  : undefined
              }
            >
              {visibleTenants.map((tenant) => (
                <DirectoryLogoCell
                  key={tenant.name}
                  tenant={tenant}
                  directoryHref={center.tenantDirectoryUrl}
                  eager={pdfMode}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {sitePlanOpen && center.sitePlan ? (
        <SitePlanLightbox
          centerName={center.name}
          src={center.sitePlan}
          onClose={() => setSitePlanOpen(false)}
        />
      ) : null}
    </div>
  );
}
