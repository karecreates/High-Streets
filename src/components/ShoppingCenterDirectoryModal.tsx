import { useEffect, useState } from "react";
import type {
  ShoppingCenter,
  ShoppingCenterTenant,
  ShoppingCenterVacancy,
} from "../data/shoppingCenters";
import { getLogoDevImageUrl } from "../utils/logoDev";

interface ShoppingCenterDirectoryModalProps {
  center: ShoppingCenter;
  onClose: () => void;
}

function DirectoryLogoCell({ tenant }: { tenant: ShoppingCenterTenant }) {
  const hasLogoDomain = Boolean(tenant.logoDomain);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [showName, setShowName] = useState(!hasLogoDomain);
  const href = tenant.website;

  useEffect(() => {
    const url = tenant.logoDomain ? getLogoDevImageUrl(tenant.logoDomain) : null;
    if (!url) {
      setLogoSrc(null);
      setShowName(true);
      return;
    }

    let cancelled = false;
    setLogoSrc(null);
    setShowName(false);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!cancelled) {
        setLogoSrc(url);
        setShowName(false);
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        setLogoSrc(null);
        setShowName(true);
      }
    };
    img.src = url;

    return () => {
      cancelled = true;
    };
  }, [tenant.logoDomain]);

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

export function ShoppingCenterDirectoryModal({
  center,
  onClose,
}: ShoppingCenterDirectoryModalProps) {
  const hasVacancies = center.vacancies.length > 0;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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
          <div>
            <h2 id="shopping-center-directory-title">{center.name}</h2>
            <p className="shopping-center-directory__meta">
              {center.tenants.length} tenants
              {hasVacancies
                ? ` · ${center.vacancies.length} ${
                    center.vacancies.length === 1 ? "vacancy" : "vacancies"
                  }`
                : ""}
            </p>
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
                <DirectoryLogoCell key={tenant.name} tenant={tenant} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
