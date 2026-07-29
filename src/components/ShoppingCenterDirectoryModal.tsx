import { useEffect, useState } from "react";
import type {
  ShoppingCenter,
  ShoppingCenterTenant,
  ShoppingCenterVacancy,
} from "../data/shoppingCenters";
import { useLogoProvider } from "../hooks/useLogoProvider";
import { loadBrandLogoImage } from "../utils/logoProvider";
import { getLogoRouteOverride } from "../utils/logoRouteOverrides";

interface ShoppingCenterDirectoryModalProps {
  center: ShoppingCenter;
  onClose: () => void;
}

function DirectoryLogoCell({
  tenant,
  directoryHref,
}: {
  tenant: ShoppingCenterTenant;
  directoryHref?: string;
}) {
  const [provider] = useLogoProvider();
  const forceText =
    !tenant.logoDomain || getLogoRouteOverride(tenant.logoDomain) === "text";
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [showName, setShowName] = useState(forceText);
  const href = directoryHref ?? tenant.website;

  useEffect(() => {
    let cancelled = false;
    setLogoSrc(null);
    setShowName(forceText);

    if (forceText || !tenant.logoDomain) return;

    (async () => {
      const img = await loadBrandLogoImage(tenant.logoDomain);
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
  }, [tenant.logoDomain, provider, forceText]);

  const content = showName ? (
    <span className="shopping-center-directory__name">{tenant.name}</span>
  ) : logoSrc ? (
    <img src={logoSrc} alt="" loading="lazy" />
  ) : null;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="shopping-center-directory__cell"
        title={showName ? tenant.name : undefined}
        aria-label={tenant.name}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className="shopping-center-directory__cell"
      title={showName ? tenant.name : undefined}
      aria-label={tenant.name}
    >
      {content}
    </div>
  );
}

function VacancyCard({ vacancy }: { vacancy: ShoppingCenterVacancy }) {
  return (
    <article className="shopping-center-directory__vacancy-card">
      <div className="shopping-center-directory__vacancy-card-top">
        <span className="shopping-center-directory__vacancy-label">
          {vacancy.label}
        </span>
        <span className="shopping-center-directory__vacancy-badge">Vacant</span>
      </div>
      {vacancy.spaceSf ? (
        <p className="shopping-center-directory__vacancy-sf">
          {vacancy.spaceSf} SF
        </p>
      ) : (
        <p className="shopping-center-directory__vacancy-sf">
          Square footage TBD
        </p>
      )}
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
}: ShoppingCenterDirectoryModalProps) {
  const hasVacancies = center.vacancies.length > 0;
  const [sitePlanOpen, setSitePlanOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !sitePlanOpen) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, sitePlanOpen]);

  return (
    <div
      className="shopping-center-directory"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shopping-center-directory-title"
      onClick={onClose}
    >
      <div
        className={`shopping-center-directory__panel${
          hasVacancies ? " shopping-center-directory__panel--with-sidebar" : ""
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="shopping-center-directory__header">
          <div className="shopping-center-directory__header-copy">
            <h2 id="shopping-center-directory-title">{center.name}</h2>
            <p className="shopping-center-directory__meta">
              {center.tenants.length} tenants
              {hasVacancies
                ? ` · ${center.vacancies.length} ${
                    center.vacancies.length === 1 ? "vacancy" : "vacancies"
                  }`
                : ""}
            </p>
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

          <div className="shopping-center-directory__main">
            <h3 className="shopping-center-directory__section-title">
              Tenants
            </h3>
            <div className="shopping-center-directory__grid">
              {center.tenants.map((tenant) => (
                <DirectoryLogoCell
                  key={tenant.name}
                  tenant={tenant}
                  directoryHref={center.tenantDirectoryUrl}
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
