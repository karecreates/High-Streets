import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
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
} from "../context/TenantsContext";
import { useMajorTenantsFilter } from "../hooks/useMajorTenantsFilter";
import { useStaticMapMode } from "../hooks/useStaticMapMode";
import { getCorridorBySlug, getCorridorDetail } from "../data/highStreets";
import {
  getMajorTenantAllowlist,
  MAJOR_TENANTS_DEFAULT_ON,
  resolveMajorTenantLayoutSlug,
} from "../data/majorTenants";
import {
  getShoppingCenter,
  type ShoppingCenter,
} from "../data/shoppingCenters";
import { corridorInfoPath } from "../utils/corridorPaths";
import { leaveMapTo } from "../utils/leaveMapTo";
import {
  filterByProximity,
  NEARBY_TENANT_RADIUS_M,
} from "../utils/geoProximity";
import { groupVacanciesByLocation } from "../utils/groupVacanciesByLocation";
import { getMasterMapId } from "../utils/mapConfig";
import { MAP_STYLES_WITH_STREET_LABELS } from "../utils/mapStyles";
import { getNearbyShoppingCenters } from "../utils/mapContextOverlays";
import { reportPlaybookGates } from "../pdf/usePlaybookReady";
import { enableThrottledLogoRetries } from "../utils/logoProvider";
import { isNamedTenant } from "../utils/tenantDisplay";
import type { VacancyLocationGroup } from "../types/vacancy";

export interface ShoppingCenterMapPdfOptions {
  /** Center to render instead of the route param. */
  slug: string;
  /** Fires once the map is idle and the directory logos have settled. */
  onReady?: () => void;
}

interface ShoppingCenterMapPageProps {
  /**
   * Booklet export: static map with the tenant-logo directory already open,
   * standing in for the broker clicking the center logo.
   */
  pdf?: ShoppingCenterMapPdfOptions;
}

export function ShoppingCenterMapPage({
  pdf,
}: ShoppingCenterMapPageProps = {}) {
  const params = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  /**
   * The exporter loads this same route (`/center/:slug/map?mode=pdf`) so the
   * booklet gets the live map + tenant directory, not a restyled clone.
   */
  const pdfMode = Boolean(pdf) || searchParams.get("mode") === "pdf";
  const slug = pdf?.slug ?? params.slug;
  const corridor = slug ? getCorridorBySlug(slug) : undefined;
  const center = slug ? getShoppingCenter(slug) : undefined;
  const infoPath =
    slug && getCorridorDetail(slug) ? corridorInfoPath(slug) : "/dashboard";
  const allTenants = useAllStreetTenants();
  const allVacancies = useAllStreetVacancies();
  const [directoryCenter, setDirectoryCenter] = useState<ShoppingCenter | null>(
    null
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
  const [logosSettled, setLogosSettled] = useState(false);

  const majorTenantAllowlist = useMemo(
    () => getMajorTenantAllowlist(slug),
    [slug]
  );
  const layoutSlug = useMemo(
    () => resolveMajorTenantLayoutSlug(slug),
    [slug]
  );
  const curatedMajors = Boolean(majorTenantAllowlist);

  const [displayMode, setDisplayMode] = useState<MapDisplayMode>(() =>
    slug && MAJOR_TENANTS_DEFAULT_ON.has(slug) ? "tenants" : "both"
  );
  const [majorTenantsOnly, setMajorTenantsOnly] = useState(() =>
    Boolean(
      slug &&
        (MAJOR_TENANTS_DEFAULT_ON.has(slug) || getMajorTenantAllowlist(slug))
    )
  );
  const [showMeteredParking, setShowMeteredParking] = useState(false);
  const [showParkingLots, setShowParkingLots] = useState(false);
  const [focusedVacancyGroupKey, setFocusedVacancyGroupKey] = useState<
    string | null
  >(null);

  const handleMapIdle = useCallback(() => setMapIdle(true), []);
  const handleLogosSettled = useCallback(() => setLogosSettled(true), []);

  useEffect(() => {
    if (!pdfMode) return;
    enableThrottledLogoRetries();
  }, [pdfMode]);

  useEffect(() => {
    if (!pdfMode) return;
    reportPlaybookGates({ map: mapIdle, logos: logosSettled });
    if (mapIdle && logosSettled) {
      document.documentElement.setAttribute("data-center-map-ready", "1");
    }
    // Playwright only needs the basemap. Directory logos are stamped from
    // this browser and must not block data-pdf-ready.
    if (mapIdle) pdf?.onReady?.();
  }, [logosSettled, mapIdle, pdf, pdfMode]);

  useEffect(() => {
    if (!pdfMode) return;
    const fallback = window.setTimeout(() => {
      setMapIdle(true);
      setLogosSettled(true);
    }, 10_000);
    return () => window.clearTimeout(fallback);
  }, [pdfMode]);

  /*
   * Live SMP / Sportsmen stay pin-only. Booklet pages always use a clean
   * framed map — One Colorado / The Paseo otherwise inherit Old Town logos
   * around the directory, which is not how South Coast Plaza exports.
   */
  const cleanBasemap =
    pdfMode ||
    slug === "santa-monica-place" ||
    slug === "sportsmen-lodge";
  const nearbyTenants = useMemo(() => {
    if (!center || cleanBasemap) return [];
    return filterByProximity(
      allTenants,
      center.mapCenter,
      NEARBY_TENANT_RADIUS_M
    );
  }, [allTenants, center, cleanBasemap]);

  const nearbyVacancies = useMemo(() => {
    if (!center || cleanBasemap) return [];
    return filterByProximity(
      allVacancies,
      center.mapCenter,
      NEARBY_TENANT_RADIUS_M
    );
  }, [allVacancies, center, cleanBasemap]);

  const majorFilterDataKey =
    corridor?.dataKey ??
    (layoutSlug ? getCorridorBySlug(layoutSlug)?.dataKey : undefined);

  const {
    tenants: mapTenants,
    filtering: majorTenantsFiltering,
  } = useMajorTenantsFilter(nearbyTenants, majorTenantsOnly, {
    allowlist: majorTenantAllowlist,
    slug,
    dataKey: majorFilterDataKey,
  });

  const vacancyGroups = useMemo(
    () => groupVacanciesByLocation(nearbyVacancies),
    [nearbyVacancies]
  );

  const tenantsCount = useMemo(() => {
    if (majorTenantsOnly) {
      return mapTenants.filter(
        (tenant) =>
          !majorFilterDataKey || tenant.highStreet === majorFilterDataKey
      ).length;
    }
    return nearbyTenants.filter(
      (tenant) =>
        tenant.lat != null &&
        tenant.lng != null &&
        isNamedTenant(tenant.tenantName)
    ).length;
  }, [majorFilterDataKey, majorTenantsOnly, mapTenants, nearbyTenants]);

  const shoppingCenters = useMemo(() => {
    if (!center) return [];
    if (cleanBasemap) {
      // Booklet / directory view: basemap only. Live map keeps the center pin.
      return pdfMode ? [] : [center];
    }
    return getNearbyShoppingCenters(center.mapCenter, {
      alwaysIncludeSlug: center.slug,
    });
  }, [center, cleanBasemap, pdfMode]);

  const handleShoppingCenterSelect = useCallback((selected: ShoppingCenter) => {
    if (selected.mapPinOnly) return;
    setDirectoryCenter(selected);
  }, []);

  const handleMajorTenantsChange = useCallback(
    (active: boolean) => {
      setMajorTenantsOnly(active);
      if (active && displayMode === "vacancies") {
        setDisplayMode("both");
      }
    },
    [displayMode]
  );

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

  const deconflictActive = majorTenantsOnly && curatedMajors;

  /*
   * Booklet export: the directory is the point of this page, so it opens
   * without a click. Static mode normally suppresses it.
   */
  const pdfDirectoryCenter =
    pdfMode && center && !center.mapPinOnly ? center : null;
  const activeDirectoryCenter =
    pdfDirectoryCenter ?? (staticMode ? null : directoryCenter);

  if (!corridor?.active || !center) {
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

        {!staticMode && curatedMajors ? (
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
              mapId={cleanBasemap ? undefined : getMasterMapId()}
              filename={`${center.name} Map.pdf`}
            />
          </>
        )}

        <TenantMapView
          tenants={mapTenants}
          vacancies={
            pdfMode || displayMode === "tenants" ? [] : nearbyVacancies
          }
          defaultCenter={center.mapCenter}
          defaultZoom={center.mapZoom}
          autoFitBounds={false}
          embedded
          displayMode={displayMode}
          focusedVacancyGroupKey={focusedVacancyGroupKey}
          onVacancyFocusComplete={handleVacancyFocusComplete}
          showMeteredParking={showMeteredParking}
          showParkingLots={showParkingLots}
          mapIdOverride={cleanBasemap ? undefined : getMasterMapId()}
          jsonMapStyles={
            cleanBasemap ? MAP_STYLES_WITH_STREET_LABELS : undefined
          }
          staticMode={staticMode}
          shoppingCenters={shoppingCenters}
          onShoppingCenterSelect={
            staticMode ? undefined : handleShoppingCenterSelect
          }
          deconflictLogos={deconflictActive}
          deconflictLayoutSlug={deconflictActive ? layoutSlug : undefined}
          onMapIdle={pdfMode ? handleMapIdle : undefined}
          onMapReady={pdfMode ? undefined : handleMapReady}
        />

        {activeDirectoryCenter ? (
          <ShoppingCenterDirectoryModal
            center={activeDirectoryCenter}
            onClose={() => setDirectoryCenter(null)}
            pdfMode={pdfMode}
            onLogosSettled={pdfMode ? handleLogosSettled : undefined}
          />
        ) : null}
      </div>
    </div>
  );
}
