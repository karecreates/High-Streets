import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BetaLogo } from "../components/BetaLogo";
import { GlassNavButton } from "../components/GlassNavButton";
import { HeroClickLottie } from "../components/HeroClickLottie";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  getCorridorDetail,
  HIGH_STREET_CORRIDORS,
  HERO_SLIDES,
  type HighStreetCorridor,
} from "../data/highStreets";
import { getShoppingCenter } from "../data/shoppingCenters";

interface DashboardLocationState {
  fromGate?: boolean;
  selectedSlug?: string;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as DashboardLocationState | null) ?? {};
  const slides = HERO_SLIDES.length
    ? HERO_SLIDES
    : HIGH_STREET_CORRIDORS.slice(0, 1);
  const initialSlug =
    locationState.selectedSlug && slides.some((s) => s.slug === locationState.selectedSlug)
      ? locationState.selectedSlug
      : slides[0]?.slug ?? "";
  const [selectedSlug, setSelectedSlug] = useState(initialSlug);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);
  const [fromGate] = useState(() => Boolean(locationState.fromGate));
  const [revealed, setRevealed] = useState(() => !locationState.fromGate);

  useEffect(() => {
    if (!fromGate) return;
    const frame = window.requestAnimationFrame(() => {
      setRevealed(true);
    });
    window.history.replaceState({}, document.title);
    return () => window.cancelAnimationFrame(frame);
  }, [fromGate]);

  const displayCorridor = useMemo(() => {
    const slug = previewSlug ?? selectedSlug;
    return (
      HIGH_STREET_CORRIDORS.find((corridor) => corridor.slug === slug) ??
      slides[0]
    );
  }, [previewSlug, selectedSlug, slides]);

  const carouselIndex = slides.findIndex((slide) => slide.slug === selectedSlug);
  const hasDetail = Boolean(
    displayCorridor && getCorridorDetail(displayCorridor.slug)
  );

  const go = useCallback(
    (delta: number) => {
      const base = carouselIndex >= 0 ? carouselIndex : 0;
      const next = (base + delta + slides.length) % slides.length;
      setPreviewSlug(null);
      setSelectedSlug(slides[next].slug);
    },
    [carouselIndex, slides]
  );

  const handleCorridorClick = (corridor: HighStreetCorridor) => {
    const hasDetailPage = Boolean(getCorridorDetail(corridor.slug));

    if (
      corridor.category === "high-streets" ||
      (corridor.category === "shopping-centers" && hasDetailPage) ||
      (corridor.category === "shopping-districts" && hasDetailPage)
    ) {
      setPreviewSlug(corridor.slug);
      if (corridor.category === "high-streets") {
        setSelectedSlug(corridor.slug);
      }
      return;
    }

    if (
      corridor.category === "shopping-centers" &&
      corridor.active &&
      getShoppingCenter(corridor.slug)
    ) {
      navigate(`/center/${corridor.slug}/map`);
      return;
    }

    if (corridor.dataKey) {
      navigate(`/map?corridor=${corridor.slug}`);
    }
  };

  const openDetail = () => {
    if (!displayCorridor?.slug || !hasDetail) return;

    if (displayCorridor.category === "shopping-centers") {
      navigate(`/center/${displayCorridor.slug}`);
      return;
    }

    navigate(`/street/${displayCorridor.slug}`);
  };

  return (
    <div
      className={`dashboard dashboard--frame1${
        fromGate ? (revealed ? " dashboard--revealed" : " dashboard--entering") : ""
      }`}
    >
      <aside className="dashboard-sidebar">
        <h1 className="dashboard-sidebar__title">HIGH STREET DASHBOARD</h1>
        <p className="dashboard-sidebar__subtitle">All Corridors</p>
        <button
          type="button"
          className="pill-btn pill-btn--primary dashboard-sidebar__master-map"
          onClick={() => navigate("/map")}
        >
          Master High Street Map
        </button>
        <nav className="corridor-list" aria-label="High streets">
          {CATEGORY_ORDER.map((category) => (
            <div key={category} className="corridor-list__group">
              <h2 className="corridor-list__heading">
                {CATEGORY_LABELS[category]}
              </h2>
              {HIGH_STREET_CORRIDORS.filter(
                (c) => c.category === category
              ).map((corridor) => {
                const hasData = Boolean(corridor.dataKey);
                const isHighStreet = corridor.category === "high-streets";
                const hasCorridorDetail = Boolean(getCorridorDetail(corridor.slug));
                const hasCenterDetail =
                  corridor.category === "shopping-centers" && hasCorridorDetail;
                const hasDistrictDetail =
                  corridor.category === "shopping-districts" && hasCorridorDetail;
                const isShoppingCenterReady =
                  corridor.category === "shopping-centers" &&
                  corridor.active &&
                  (hasCenterDetail || Boolean(getShoppingCenter(corridor.slug)));
                const isSelected = corridor.slug === displayCorridor?.slug;

                return (
                  <button
                    key={corridor.slug}
                    type="button"
                    className={`corridor-list__item ${
                      isSelected ? "corridor-list__item--active" : ""
                    } ${
                      isHighStreet || hasCenterDetail || hasDistrictDetail
                        ? "corridor-list__item--detail"
                        : hasData || isShoppingCenterReady
                          ? "corridor-list__item--map-only"
                          : "corridor-list__item--pending"
                    }`}
                    onClick={() => handleCorridorClick(corridor)}
                    disabled={
                      !isHighStreet &&
                      !hasData &&
                      !isShoppingCenterReady &&
                      !hasDistrictDetail
                    }
                    title={
                      isHighStreet || hasCenterDetail || hasDistrictDetail
                        ? `Preview ${corridor.name}`
                        : isShoppingCenterReady
                          ? `View ${corridor.name} directory map`
                          : hasData
                            ? `View ${corridor.name} on the master map`
                            : `${corridor.name} — data coming soon`
                    }
                  >
                    {corridor.name}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="dashboard-sidebar__logo">
          <BetaLogo />
        </div>
      </aside>

      <section
        className={`hero-panel${hasDetail ? " hero-panel--clickable" : ""}`}
        aria-label="Corridor preview"
        role={hasDetail ? "button" : undefined}
        tabIndex={hasDetail ? 0 : undefined}
        onClick={openDetail}
        onKeyDown={(e) => {
          if (hasDetail && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            openDetail();
          }
        }}
      >
        {displayCorridor?.heroImage ? (
          <img
            key={displayCorridor.slug}
            className="hero-panel__image"
            src={displayCorridor.heroImage}
            alt={`${displayCorridor.name}, ${displayCorridor.city}`}
            style={
              displayCorridor.heroObjectPosition
                ? { objectPosition: displayCorridor.heroObjectPosition }
                : undefined
            }
          />
        ) : (
          <div className="hero-panel__placeholder" />
        )}
        <div className="hero-panel__gradient" />
        {hasDetail ? <HeroClickLottie /> : null}
        <div className="hero-panel__caption">
          <h2 className="hero-panel__name">
            {displayCorridor?.name?.toUpperCase()}
          </h2>
          <p className="hero-panel__city">
            {displayCorridor?.city?.toUpperCase()}
          </p>
        </div>
        <div className="hero-panel__nav">
          <GlassNavButton
            direction="prev"
            label="Previous corridor"
            onClick={() => go(-1)}
          />
          <GlassNavButton
            direction="next"
            label="Next corridor"
            onClick={() => go(1)}
          />
        </div>
      </section>
    </div>
  );
}
