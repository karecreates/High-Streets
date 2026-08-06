import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { AnimatedDisplay } from "../components/AnimatedDisplay";
import { BrandLogoGrid } from "../components/BrandLogoGrid";
import { BetaLogo } from "../components/BetaLogo";
import { PillButton } from "../components/PillButton";
import { ScoreRing } from "../components/ScoreRing";
import { useTenantsContext } from "../context/TenantsContext";
import { getShoppingCenter } from "../data/shoppingCenters";
import {
  CATEGORY_LABELS,
  getCorridorBySlug,
  getCorridorDetail,
} from "../data/highStreets";
import {
  pickNotableBrandsFromCenterTenants,
  pickNotableBrandsFromStreetTenants,
} from "../utils/pickNotableBrands";
import { isNamedTenant } from "../utils/tenantDisplay";

function categoryEyebrow(category: string | undefined): string {
  if (!category) return "High Streets";
  const label = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS];
  if (!label) return "High Streets";
  return label
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Vacancy rate = vacancies ÷ occupied spaces. */
function formatVacancyRate(vacancies: number, occupied: number): string | null {
  if (occupied <= 0) return null;
  const rate = (vacancies / occupied) * 100;
  const rounded = Math.round(rate * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

export function StreetDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const corridor = slug ? getCorridorBySlug(slug) : undefined;
  const detail = slug ? getCorridorDetail(slug) : undefined;
  const { dataset, vacanciesDataset } = useTenantsContext();
  const shoppingCenter = slug ? getShoppingCenter(slug) : undefined;

  const brandItems = useMemo(() => {
    if (!corridor || !detail) return [];

    const liveBrands =
      corridor.category === "shopping-centers" && shoppingCenter
        ? pickNotableBrandsFromCenterTenants(shoppingCenter.tenants, 60)
        : corridor.dataKey && dataset
          ? pickNotableBrandsFromStreetTenants(
              dataset.tenants.filter((t) => t.highStreet === corridor.dataKey),
              60
            )
          : [];

    const curatedBrands = (detail.notableBrands ?? []).filter((b) =>
      Boolean(b.domain)
    );

    const byDomain = new Map<
      string,
      { name: string; domain: string; src?: string }
    >();
    for (const brand of [...curatedBrands, ...liveBrands]) {
      if (!brand.domain || byDomain.has(brand.domain)) continue;
      byDomain.set(brand.domain, {
        name: brand.name,
        domain: brand.domain,
        src: "src" in brand ? (brand.src as string | undefined) : undefined,
      });
    }
    return [...byDomain.values()];
  }, [corridor, dataset, detail, shoppingCenter]);

  const vacancyRate = useMemo(() => {
    if (!corridor) return null;

    if (corridor.category === "shopping-centers" && shoppingCenter) {
      const occupied = shoppingCenter.tenants.filter((t) =>
        isNamedTenant(t.name)
      ).length;
      return formatVacancyRate(shoppingCenter.vacancies.length, occupied);
    }

    if (!corridor.dataKey || !dataset) return null;
    const occupied = dataset.tenants.filter(
      (t) =>
        t.highStreet === corridor.dataKey && isNamedTenant(t.tenantName)
    ).length;
    const vacancies =
      vacanciesDataset?.vacancies.filter(
        (v) => v.highStreet === corridor.dataKey
      ).length ?? 0;
    return formatVacancyRate(vacancies, occupied);
  }, [corridor, dataset, shoppingCenter, vacanciesDataset]);

  if (!corridor?.active || !detail) {
    return (
      <div className="street-page street-page--empty">
        <p>This corridor is not available yet.</p>
        <PillButton to="/dashboard">← Back to Dashboard</PillButton>
      </div>
    );
  }

  const staticLogos = detail.brandLogos;
  const mapPath =
    corridor.category === "shopping-centers"
      ? `/center/${slug}/map`
      : `/street/${slug}/map`;
  const backPath = "/dashboard";

  return (
    <div className="street-page street-page--detail">
      <div className="street-detail">
        <div className="street-detail__content">
          <div className="street-detail__stack">
            <header className="street-detail__intro">
              <p className="street-detail__eyebrow">
                {categoryEyebrow(corridor.category)}
              </p>
              <h1 className="street-detail__title">{detail.title}</h1>
              <div className="street-detail__rule" />
            </header>

            <div className="street-detail__overview">
              <p className="street-detail__body">{detail.description}</p>
              <div className="score-panel">
                <div className="score-rings">
                  <ScoreRing
                    label="BIKE SCORE"
                    value={detail.bikeScore}
                    variant="teal"
                  />
                  <ScoreRing
                    label="WALK SCORE"
                    value={detail.walkScore}
                    variant="slate"
                    delay={120}
                  />
                </div>
              </div>
            </div>

            <div className="street-detail__row">
              <div className="info-card info-card--compact info-card--rents">
                <div className="info-card__header">
                  ESTIMATED RENTS &amp; VACANCY RATE
                </div>
                <div className="info-card__metrics">
                  <div className="info-card__metric">
                    <p className="info-card__metric-value">
                      {detail.estimatedRents}
                    </p>
                    <span className="info-card__metric-label">
                      Estimated rents
                    </span>
                  </div>
                  {vacancyRate ? (
                    <div className="info-card__metric">
                      <p className="info-card__metric-value">{vacancyRate}</p>
                      <span className="info-card__metric-label">
                        Vacancy rate
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {detail.trafficCounts.length ? (
                <div className="traffic-card">
                  <h3 className="traffic-card__title">Traffic Counts</h3>
                  <ul className="traffic-card__list">
                    {detail.trafficCounts.map((row, index) => (
                      <li key={`${row.street}-${row.count}-${index}`}>
                        <span>{row.street}</span>
                        <strong>
                          <AnimatedDisplay
                            value={row.count}
                            delay={1000 + index * 160}
                            duration={1300}
                          />
                        </strong>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="info-card">
              <div className="info-card__header">TRADE AREA STATISTICS</div>
              <ul className="stat-list">
                {detail.areaStats.map((stat, index) => (
                  <li key={stat.label} className="stat-list__item">
                    <AnimatedDisplay
                      className="stat-list__value"
                      value={stat.value}
                      delay={450 + index * 130}
                      duration={1200}
                    />
                    <span className="stat-list__label">{stat.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="info-card info-card--brands info-card--compact">
              <div className="info-card__header">SELECTIVE BRANDS</div>
              {brandItems.length ? (
                <BrandLogoGrid brands={brandItems} limit={10} />
              ) : staticLogos?.length ? (
                <div className="brand-grid brand-grid--large">
                  {staticLogos.slice(0, 10).map((src) => (
                    <div key={src} className="brand-grid__cell">
                      <img src={src} alt="" loading="lazy" />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="street-detail__actions">
              <PillButton to={backPath}>← Back to Dashboard</PillButton>
              <PillButton to={mapPath}>View Interactive Map →</PillButton>
            </div>
          </div>

          <footer className="street-detail__footer">
            <BetaLogo />
          </footer>
        </div>

        <div className="street-detail__gallery">
          <div className="gallery-grid">
            {detail.galleryImages.map((img, i) => (
              <div
                key={img.src}
                className={`gallery-grid__item gallery-grid__item--${i}`}
              >
                <img src={img.src} alt={img.alt} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
