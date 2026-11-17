import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { reportPlaybookGates, usePlaybookReady } from "../pdf/usePlaybookReady";
import {
  MapControlsBar,
  type MapDisplayMode,
} from "../components/MapControlsBar";
import { MajorTenantsToggle } from "../components/MajorTenantsToggle";
import { PillButton } from "../components/PillButton";
import { ShoppingCenterDirectoryModal } from "../components/ShoppingCenterDirectoryModal";
import { MapPrintButton } from "../components/MapPrintButton";
import { StaticModeChrome } from "../components/StaticModeChrome";
import { TenantMapView } from "../components/TenantMap";
import {
  useAllStreetTenants,
  useAllStreetVacancies,
  useStreetTenants,
  useStreetVacancies,
} from "../context/TenantsContext";
import { useMajorTenantsFilter } from "../hooks/useMajorTenantsFilter";
import { useStaticMapMode } from "../hooks/useStaticMapMode";
import { getCorridorBySlug, getCorridorDetail } from "../data/highStreets";
import {
  getMajorTenantAllowlist,
  MAJOR_TENANTS_DEFAULT_ON,
} from "../data/majorTenants";
import type { ShoppingCenter } from "../data/shoppingCenters";
import {
  isWithinMeters,
  NEARBY_TENANT_RADIUS_M,
} from "../utils/geoProximity";
import { getMasterMapId } from "../utils/mapConfig";
import {
  getNearbyShoppingCenters,
  getNearbyStreetCallouts,
} from "../utils/mapContextOverlays";
import { corridorInfoPath, corridorMapPath } from "../utils/corridorPaths";
import { leaveMapTo } from "../utils/leaveMapTo";
import { groupVacanciesByLocation } from "../utils/groupVacanciesByLocation";
import { enableThrottledLogoRetries } from "../utils/logoProvider";
import { isNamedTenant } from "../utils/tenantDisplay";
import type { VacancyLocationGroup } from "../types/vacancy";

interface StreetMapLocationState {
  introZoom?: boolean;
  center?: { lat: number; lng: number };
  zoom?: number;
}

export interface StreetMapPdfOptions {
  /** Corridor to render instead of the route param. */
  slug: string;
  /** Fires once the map is idle with tenant markers drawn. */
  onReady?: () => void;
}

interface StreetMapPageProps {
  /**
   * Booklet export: the Static Mode view exactly as the app renders it —
   * curated camera, curated Major Tenants, curated logo layout — with the
   * interactive chrome removed. The booklet must not re-frame or re-pick
   * anything, or the page stops matching what the broker just looked at.
   */
  pdf?: StreetMapPdfOptions;
}

export function StreetMapPage({ pdf }: StreetMapPageProps = {}) {
  const params = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  /**
   * The exporter loads this same route (`/street/:slug/map?mode=pdf`) so the
   * booklet gets the Interactive Map camera and logo layout, not a restyled
   * playbook clone.
   */
  const pdfMode = Boolean(pdf) || searchParams.get("mode") === "pdf";
  const slug = pdf?.slug ?? params.slug;
  const location = useLocation();
  const locationState = pdfMode
    ? null
    : (location.state as StreetMapLocationState | null);
  const corridor = slug ? getCorridorBySlug(slug) : undefined;
  const detail = slug ? getCorridorDetail(slug) : undefined;
  const corridorTenants = useStreetTenants(corridor?.dataKey ?? "");
  const corridorVacancies = useStreetVacancies(corridor?.dataKey ?? "");
  const allTenants = useAllStreetTenants();
  const allVacancies = useAllStreetVacancies();
  /**
   * Booklet pages show Occupied only — vacancy pins are a leasing tool, not
   * presentation content.
   */
  const [displayMode, setDisplayMode] = useState<MapDisplayMode>(() =>
    pdfMode || (slug && MAJOR_TENANTS_DEFAULT_ON.has(slug))
      ? "tenants"
      : "both"
  );
  /**
   * Major Tenants is pre-filtered only where the corridor has a curated
   * allowlist. Elsewhere the filter falls back to a Brandfetch wordmark
   * heuristic that can strip a corridor to two or three pins, so the booklet
   * reproduces what a broker sees on the Interactive Map instead.
   */
  const [majorTenantsOnly, setMajorTenantsOnly] = useState(() =>
    Boolean(
      slug &&
        (MAJOR_TENANTS_DEFAULT_ON.has(slug) || getMajorTenantAllowlist(slug))
    )
  );
  const [textOnly, setTextOnly] = useState(false);
  const [showMeteredParking, setShowMeteredParking] = useState(false);
  const [showParkingLots, setShowParkingLots] = useState(false);
  const [focusedVacancyGroupKey, setFocusedVacancyGroupKey] = useState<
    string | null
  >(null);
  const [directoryCenter, setDirectoryCenter] = useState<ShoppingCenter | null>(
    null
  );
  const [introZoomComplete, setIntroZoomComplete] = useState(
    () => !locationState?.introZoom
  );
  const mapFrameRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);
  const { staticMode, enterStaticMode, exitStaticMode } = useStaticMapMode(
    mapFrameRef,
    { forceStatic: pdfMode }
  );
  const [mapIdle, setMapIdle] = useState(false);
  const [iconsReady, setIconsReady] = useState(false);

  usePlaybookReady(pdfMode && mapIdle && iconsReady);

  useEffect(() => {
    if (!pdfMode) return;
    enableThrottledLogoRetries();
    document.documentElement.classList.add("pdf-map-capture");
    return () => document.documentElement.classList.remove("pdf-map-capture");
  }, [pdfMode]);

  useEffect(() => {
    if (!pdfMode) return;
    reportPlaybookGates({ map: mapIdle, logos: iconsReady });
    if (mapIdle && iconsReady) pdf?.onReady?.();
  }, [iconsReady, mapIdle, pdf, pdfMode]);

  useEffect(() => {
    if (!pdfMode) return;
    const fallback = window.setTimeout(() => {
      setMapIdle(true);
      setIconsReady(true);
    }, 10_000);
    return () => window.clearTimeout(fallback);
  }, [pdfMode]);

  const introTarget = useMemo(() => {
    if (!locationState?.introZoom) return null;
    return {
      center: locationState.center ?? detail?.mapCenter ?? { lat: 0, lng: 0 },
      zoom: locationState.zoom ?? detail?.mapZoom ?? 18,
    };
  }, [detail?.mapCenter, detail?.mapZoom, locationState]);

  const mapCenter = introTarget?.center ?? detail?.mapCenter;
  const baseMapZoom = introTarget?.center ? introTarget.zoom : detail?.mapZoom;

  const focusCenter = mapCenter ?? detail?.mapCenter;

  /** This corridor + only nearby tenants from other corridors. */
  const proximityTenants = useMemo(() => {
    if (!focusCenter || !corridor?.dataKey) return corridorTenants;
    const nearby = allTenants.filter(
      (tenant) =>
        tenant.highStreet !== corridor.dataKey &&
        tenant.lat != null &&
        tenant.lng != null &&
        isWithinMeters(
          focusCenter,
          { lat: tenant.lat, lng: tenant.lng },
          NEARBY_TENANT_RADIUS_M
        )
    );
    if (!nearby.length) return corridorTenants;
    const byId = new Map<string, (typeof corridorTenants)[number]>();
    for (const tenant of [...corridorTenants, ...nearby]) {
      byId.set(tenant.id, tenant);
    }
    return [...byId.values()];
  }, [allTenants, corridor?.dataKey, corridorTenants, focusCenter]);

  const proximityVacancies = useMemo(() => {
    if (!focusCenter || !corridor?.dataKey) return corridorVacancies;
    const nearby = allVacancies.filter(
      (vacancy) =>
        vacancy.highStreet !== corridor.dataKey &&
        vacancy.lat != null &&
        vacancy.lng != null &&
        isWithinMeters(
          focusCenter,
          { lat: vacancy.lat, lng: vacancy.lng },
          NEARBY_TENANT_RADIUS_M
        )
    );
    if (!nearby.length) return corridorVacancies;
    const byId = new Map<string, (typeof corridorVacancies)[number]>();
    for (const vacancy of [...corridorVacancies, ...nearby]) {
      byId.set(vacancy.id, vacancy);
    }
    return [...byId.values()];
  }, [allVacancies, corridor?.dataKey, corridorVacancies, focusCenter]);

  const shoppingCenters = useMemo(() => {
    if (!focusCenter) return [];
    return getNearbyShoppingCenters(focusCenter, {
      // Promenade: Santa Monica Place at the south end.
      // Old Town Pasadena: One Colorado in the courtyard.
      alwaysIncludeSlug:
        slug === "third-street-promenade"
          ? "santa-monica-place"
          : slug === "old-town-pasadena"
            ? "one-colorado"
            : undefined,
    });
  }, [focusCenter, slug]);

  const corridorCallouts = useMemo(() => {
    if (!focusCenter) return [];
    return getNearbyStreetCallouts(focusCenter, slug);
  }, [focusCenter, slug]);

  const majorTenantAllowlist = useMemo(
    () => getMajorTenantAllowlist(slug),
    [slug]
  );

  const filterSourceTenants = useMemo(() => {
    const corridorOnly =
      slug === "third-street-promenade" ||
      slug === "abbot-kinney" ||
      slug === "golden-triangle" ||
      slug === "old-town-pasadena";
    if (!corridorOnly || !corridor?.dataKey) {
      return proximityTenants;
    }
    return proximityTenants.filter(
      (tenant) => tenant.highStreet === corridor.dataKey
    );
  }, [corridor?.dataKey, proximityTenants, slug]);

  const {
    tenants: mapTenants,
    filtering: majorTenantsFiltering,
  } = useMajorTenantsFilter(filterSourceTenants, majorTenantsOnly, {
    allowlist: majorTenantAllowlist,
    slug,
    dataKey: corridor?.dataKey,
  });

  const vacancyGroups = useMemo(
    () => groupVacanciesByLocation(corridorVacancies),
    [corridorVacancies]
  );

  const tenantsCount = useMemo(() => {
    if (majorTenantsOnly) {
      return mapTenants.filter((t) => t.highStreet === corridor?.dataKey)
        .length;
    }
    return corridorTenants.filter(
      (tenant) =>
        tenant.lat != null &&
        tenant.lng != null &&
        isNamedTenant(tenant.tenantName)
    ).length;
  }, [corridor?.dataKey, corridorTenants, majorTenantsOnly, mapTenants]);

  const handleMajorTenantsChange = useCallback(
    (active: boolean) => {
      setMajorTenantsOnly(active);
      if (active) setTextOnly(false);
      if (active && displayMode === "vacancies") {
        setDisplayMode("both");
      }
    },
    [displayMode]
  );

  const handleTextOnlyChange = useCallback((active: boolean) => {
    setTextOnly(active);
    if (active) {
      setMajorTenantsOnly(false);
      setDisplayMode("tenants");
    }
  }, []);

  const handleVacancyFocus = useCallback(
    (group: VacancyLocationGroup) => {
      if (displayMode === "tenants") {
        setDisplayMode("both");
      }
      setFocusedVacancyGroupKey(null);
      window.requestAnimationFrame(() => {
        setFocusedVacancyGroupKey(group.key);
      });
    },
    [displayMode]
  );

  const handleVacancyFocusComplete = useCallback(() => {
    setFocusedVacancyGroupKey(null);
  }, []);

  const handleShoppingCenterSelect = useCallback((center: ShoppingCenter) => {
    if (center.mapPinOnly) return;
    setDirectoryCenter(center);
  }, []);

  const handleCorridorCalloutSelect = useCallback((calloutSlug: string) => {
    leaveMapTo(corridorMapPath(calloutSlug));
  }, []);

  const infoPath = slug ? corridorInfoPath(slug) : "/dashboard";

  const isThirdStreet = slug === "third-street-promenade";
  const supportsTextOnly = isThirdStreet || slug === "abbot-kinney";
  const deconflictActive =
    isThirdStreet ||
    textOnly ||
    (majorTenantsOnly && Boolean(majorTenantAllowlist));
  /**
   * Promenade is three long blocks — stay in tight so logos stay readable.
   * Brokers pan along the street for additional captures.
   */
  /**
   * Abbot Kinney Text Only shows every tenant along the full corridor —
   * wider camera than the curated Major Tenants framing.
   */
  const abbotKinneyTextOnly = slug === "abbot-kinney" && textOnly;
  const mapZoom = isThirdStreet
    ? textOnly
      ? 18.15
      : majorTenantsOnly
        ? (baseMapZoom ?? 18.55)
        : Math.max(baseMapZoom ?? 18, 18.7)
    : abbotKinneyTextOnly
      ? 17.1
      : baseMapZoom;
  const effectiveMapCenter = abbotKinneyTextOnly
    ? { lat: 33.99065, lng: -118.4673 }
    : mapCenter;
  const mapFocus = useMemo(() => {
    const lockCamera =
      isThirdStreet ||
      slug === "abbot-kinney" ||
      slug === "golden-triangle" ||
      slug === "old-town-pasadena" ||
      slug === "melrose" ||
      slug === "studio-city" ||
      slug === "sunset-strip" ||
      slug === "downtown-manhattan-beach" ||
      slug === "culver-city" ||
      slug === "la-brea" ||
      slug === "larchmont" ||
      slug === "montana" ||
      slug === "robertson" ||
      slug === "silver-lake" ||
      slug === "la-arts-district" ||
      slug === "downtown-la";
    if (!lockCamera || !effectiveMapCenter || mapZoom == null) {
      return null;
    }
    return { center: effectiveMapCenter, zoom: mapZoom };
  }, [isThirdStreet, effectiveMapCenter, mapZoom, slug]);

  if (!corridor?.active || !detail) {
    return (
      <div className="street-page street-page--empty">
        <p>This map is not available yet.</p>
        <PillButton to="/dashboard">← Back to Dashboard</PillButton>
      </div>
    );
  }

  return (
    <div className="street-page street-page--map">
      <div
        ref={mapFrameRef}
        className={`map-fullscreen${staticMode ? " map-fullscreen--static" : ""}`}
      >
        {!staticMode ? (
          <button
            type="button"
            className="pill-btn pill-btn--primary map-fullscreen__back"
            onClick={() => {
              leaveMapTo(infoPath);
            }}
          >
            ← Back
          </button>
        ) : null}

        {!staticMode ? (
          <div className="map-fullscreen__controls-row">
            <MapControlsBar
              tenantsCount={tenantsCount}
              vacancyGroups={vacancyGroups}
              displayMode={displayMode}
              onDisplayModeChange={setDisplayMode}
              onVacancyFocus={handleVacancyFocus}
              showMeteredParking={showMeteredParking}
              showParkingLots={showParkingLots}
              onMeteredParkingChange={setShowMeteredParking}
              onParkingLotsChange={setShowParkingLots}
            />
            <MajorTenantsToggle
              active={majorTenantsOnly}
              filtering={majorTenantsFiltering}
              onChange={handleMajorTenantsChange}
            />
            {supportsTextOnly ? (
              <MajorTenantsToggle
                label="Text Only"
                active={textOnly}
                onChange={handleTextOnlyChange}
              />
            ) : null}
          </div>
        ) : null}

        {pdfMode ? null : (
          <>
            <StaticModeChrome
              staticMode={staticMode}
              onEnter={enterStaticMode}
              onExit={exitStaticMode}
            />
            <MapPrintButton
              mapRef={mapRef}
              mapId={getMasterMapId()}
              filename={`${corridor.name} Map.pdf`}
            />
          </>
        )}

        <TenantMapView
          tenants={mapTenants}
          vacancies={pdfMode ? [] : proximityVacancies}
          defaultCenter={mapCenter}
          defaultZoom={mapZoom}
          mapFocus={mapFocus}
          autoFitBounds={false}
          embedded
          displayMode={displayMode}
          focusedVacancyGroupKey={focusedVacancyGroupKey}
          onVacancyFocusComplete={handleVacancyFocusComplete}
          showMeteredParking={showMeteredParking}
          showParkingLots={showParkingLots}
          introZoom={
            introTarget && !introZoomComplete ? introTarget : undefined
          }
          onIntroZoomComplete={() => setIntroZoomComplete(true)}
          mapIdOverride={getMasterMapId()}
          staticMode={staticMode}
          shoppingCenters={textOnly ? [] : shoppingCenters}
          onShoppingCenterSelect={
            staticMode ? undefined : handleShoppingCenterSelect
          }
          corridorCallouts={textOnly ? [] : corridorCallouts}
          onCorridorCalloutSelect={
            staticMode ? undefined : handleCorridorCalloutSelect
          }
          alwaysShowCorridorCallouts
          deconflictLogos={deconflictActive}
          deconflictLayoutSlug={
            isThirdStreet || textOnly
              ? slug
              : majorTenantsOnly && majorTenantAllowlist
                ? slug
                : undefined
          }
          deconflictDense={isThirdStreet && !majorTenantsOnly && !textOnly}
          textOnly={textOnly}
          onMapIdle={pdfMode ? () => setMapIdle(true) : undefined}
          onIconsReady={pdfMode ? () => setIconsReady(true) : undefined}
          onMapReady={pdfMode ? undefined : handleMapReady}
        />

        {directoryCenter && !staticMode ? (
          <ShoppingCenterDirectoryModal
            center={directoryCenter}
            onClose={() => setDirectoryCenter(null)}
          />
        ) : null}
      </div>
    </div>
  );
}
