import { useMemo } from "react";
import { useParams } from "react-router-dom";
import placerLogo from "@assets/logos/placer_logo_ai402x-onc6yw63cdv2bi8m8eps8fr1sczb4qf1x8fx55sc2o.png";
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
import { getPlacerInsights } from "../data/placer";
import { PlacerInsights } from "../components/PlacerInsights";
import {
  pickNotableBrandsFromCenterTenants,
  pickNotableBrandsFromStreetTenants,
} from "../utils/pickNotableBrands";
import { corridorMapPath } from "../utils/corridorPaths";
import { isNamedTenant } from "../utils/tenantDisplay";
import {
  formatVacancyRate,
  vacancyRateFromStreetData,
} from "../utils/vacancyRate";

function categoryEyebrow(category: string | undefined): string {
  if (!category) return "High Streets";
  const label = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS];
  if (!label) return "High Streets";
  return label
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function StreetDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const corridor = slug ? getCorridorBySlug(slug) : undefined;
  const detail = slug ? getCorridorDetail(slug) : undefined;
  const { dataset, vacanciesDataset } = useTenantsContext();
  const shoppingCenter = slug ? getShoppingCenter(slug) : undefined;
  const placerData = getPlacerInsights(slug);

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
    const streetTenants = dataset.tenants.filter(
      (t) => t.highStreet === corridor.dataKey
    );
    const streetVacancies =
      vacanciesDataset?.vacancies.filter(
        (v) => v.highStreet === corridor.dataKey
      ) ?? [];
    return vacancyRateFromStreetData(streetTenants, streetVacancies);
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
  const mapPath = slug ? corridorMapPath(slug) : "/dashboard";
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
                  ESTIMATED RENTS &amp; VACANCY
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
                  <div className="traffic-card__header">
                    <h3 className="traffic-card__title">
                      Traffic Counts (Cars per Day)
                    </h3>
                    <img
                      className="traffic-card__proof-logo"
                      src={placerLogo}
                      alt="Placer.ai"
                      title="Powered by Placer.ai"
                    />
                  </div>
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

            {placerData ? (
              <PlacerInsights data={placerData} />
            ) : (
              <div className="info-card">
                <div className="info-card__header">
                  TRADE AREA POLYGON* STATISTICS
                </div>
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
            )}

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
              <PillButton to={backPath} variant="outline">
                ← Back to Dashboard
              </PillButton>
              <PillButton to={mapPath} variant="outline">
                View Interactive Map →
              </PillButton>
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
