import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BetaLogo } from "../components/BetaLogo";
import { DashboardOverviewMap } from "../components/DashboardOverviewMap";
import { GlassNavButton } from "../components/GlassNavButton";
import { HeroClickLottie } from "../components/HeroClickLottie";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  getCorridorDetail,
  getSidebarGroup,
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
  const [showMappingVisual, setShowMappingVisual] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
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

  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navOpen]);

  useEffect(() => {
    if (!navOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [navOpen]);

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
    if (!corridor.active && !getCorridorDetail(corridor.slug)) return;

    const hasDetailPage = Boolean(getCorridorDetail(corridor.slug));
    const inCarousel = slides.some((slide) => slide.slug === corridor.slug);

    if (
      (corridor.category === "high-streets" && corridor.active) ||
      (corridor.category === "shopping-centers" && hasDetailPage)
    ) {
      setPreviewSlug(corridor.slug);
      if (inCarousel) {
        setSelectedSlug(corridor.slug);
      }
      setNavOpen(false);
      return;
    }

    if (
      corridor.category === "shopping-centers" &&
      corridor.active &&
      getShoppingCenter(corridor.slug)
    ) {
      setNavOpen(false);
      navigate(`/center/${corridor.slug}/map`);
      return;
    }

    if (corridor.dataKey) {
      setNavOpen(false);
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
      }${navOpen ? " dashboard--nav-open" : ""}`}
    >
      <button
        type="button"
        className="dashboard-nav-toggle"
        aria-label={navOpen ? "Close corridor menu" : "Open corridor menu"}
        aria-expanded={navOpen}
        aria-controls="dashboard-sidebar"
        onClick={() => setNavOpen((open) => !open)}
      >
        <span className="dashboard-nav-toggle__icon" aria-hidden>
          <span />
          <span />
          <span />
        </span>
      </button>

      <div
        className="dashboard-nav-backdrop"
        hidden={!navOpen}
        onClick={() => setNavOpen(false)}
      />

      <aside
        id="dashboard-sidebar"
        className={`dashboard-sidebar${navOpen ? " dashboard-sidebar--open" : ""}`}
      >
        <div className="dashboard-sidebar__top">
          <div>
            <h1 className="dashboard-sidebar__title">HIGH STREET DASHBOARD</h1>
            <p className="dashboard-sidebar__subtitle">All Corridors</p>
          </div>
          <button
            type="button"
            className="dashboard-sidebar__close"
            aria-label="Close corridor menu"
            onClick={() => setNavOpen(false)}
          >
            ×
          </button>
        </div>
        <button
          type="button"
          className="pill-btn pill-btn--primary dashboard-sidebar__master-map"
          onClick={() => {
            setNavOpen(false);
            navigate("/map");
          }}
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
                (c) => getSidebarGroup(c) === category
              ).map((corridor) => {
                const hasData = Boolean(corridor.dataKey);
                const hasCorridorDetail = Boolean(getCorridorDetail(corridor.slug));
                const hasCenterDetail =
                  corridor.category === "shopping-centers" && hasCorridorDetail;
                const isShoppingCenterReady =
                  corridor.category === "shopping-centers" &&
                  corridor.active &&
                  (hasCenterDetail || Boolean(getShoppingCenter(corridor.slug)));
                const isHighStreetReady =
                  corridor.category === "high-streets" &&
                  corridor.active &&
                  hasCorridorDetail;
                const isInteractive =
                  isHighStreetReady ||
                  hasCenterDetail ||
                  isShoppingCenterReady ||
                  (corridor.active && hasData);
                const isSelected = corridor.slug === displayCorridor?.slug;

                return (
                  <button
                    key={corridor.slug}
                    type="button"
                    className={`corridor-list__item ${
                      isSelected ? "corridor-list__item--active" : ""
                    } ${
                      !isInteractive
                        ? "corridor-list__item--pending"
                        : isHighStreetReady || hasCenterDetail
                          ? "corridor-list__item--detail"
                          : "corridor-list__item--map-only"
                    } ${
                      corridor.sidebarIndent
                        ? `corridor-list__item--indent-${corridor.sidebarIndent}`
                        : ""
                    }`}
                    onClick={() => handleCorridorClick(corridor)}
                    disabled={!isInteractive}
                    title={
                      !isInteractive
                        ? `${corridor.name} — data coming soon`
                        : isHighStreetReady || hasCenterDetail
                          ? `Preview ${corridor.name}`
                          : isShoppingCenterReady
                            ? `View ${corridor.name} directory map`
                            : `View ${corridor.name} on the master map`
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
        className={`hero-panel${
          hasDetail && !showMappingVisual ? " hero-panel--clickable" : ""
        }${showMappingVisual ? " hero-panel--mapping" : ""}`}
        aria-label={showMappingVisual ? "Corridor overview map" : "Corridor preview"}
        role={hasDetail && !showMappingVisual ? "button" : undefined}
        tabIndex={hasDetail && !showMappingVisual ? 0 : undefined}
        onClick={showMappingVisual ? undefined : openDetail}
        onKeyDown={(e) => {
          if (showMappingVisual) return;
          if (hasDetail && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            openDetail();
          }
        }}
      >
        <button
          type="button"
          className={`dashboard-view-toggle${
            showMappingVisual ? " dashboard-view-toggle--active" : ""
          }`}
          aria-pressed={showMappingVisual}
          onClick={(event) => {
            event.stopPropagation();
            setShowMappingVisual((current) => !current);
          }}
        >
          {showMappingVisual ? "Hero Visual" : "Mapping Visual"}
        </button>

        {showMappingVisual ? (
          <DashboardOverviewMap />
        ) : (
          <>
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
          </>
        )}
      </section>
    </div>
  );
}
