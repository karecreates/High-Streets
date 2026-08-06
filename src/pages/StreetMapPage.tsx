import { useCallback, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  MapControlsBar,
  type MapDisplayMode,
} from "../components/MapControlsBar";
import { MajorTenantsToggle } from "../components/MajorTenantsToggle";
import { PillButton } from "../components/PillButton";
import { ShoppingCenterDirectoryModal } from "../components/ShoppingCenterDirectoryModal";
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
import type { ShoppingCenter } from "../data/shoppingCenters";
import {
  isWithinMeters,
  NEARBY_TENANT_RADIUS_M,
} from "../utils/geoProximity";
import { getMasterMapId } from "../utils/mapConfig";
import { getNearbyShoppingCenters } from "../utils/mapContextOverlays";
import { groupVacanciesByLocation } from "../utils/groupVacanciesByLocation";
import { isNamedTenant } from "../utils/tenantDisplay";
import type { VacancyLocationGroup } from "../types/vacancy";

interface StreetMapLocationState {
  introZoom?: boolean;
  center?: { lat: number; lng: number };
  zoom?: number;
}

export function StreetMapPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const locationState = location.state as StreetMapLocationState | null;
  const corridor = slug ? getCorridorBySlug(slug) : undefined;
  const detail = slug ? getCorridorDetail(slug) : undefined;
  const corridorTenants = useStreetTenants(corridor?.dataKey ?? "");
  const corridorVacancies = useStreetVacancies(corridor?.dataKey ?? "");
  const allTenants = useAllStreetTenants();
  const allVacancies = useAllStreetVacancies();
  const [displayMode, setDisplayMode] = useState<MapDisplayMode>("both");
  const [majorTenantsOnly, setMajorTenantsOnly] = useState(false);
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
  const { staticMode, enterStaticMode, exitStaticMode } =
    useStaticMapMode(mapFrameRef);

  const introTarget = useMemo(() => {
    if (!locationState?.introZoom) return null;
    return {
      center: locationState.center ?? detail?.mapCenter ?? { lat: 0, lng: 0 },
      zoom: locationState.zoom ?? detail?.mapZoom ?? 18,
    };
  }, [detail?.mapCenter, detail?.mapZoom, locationState]);

  const mapCenter = introTarget?.center ?? detail?.mapCenter;
  const mapZoom = introTarget?.center ? introTarget.zoom : detail?.mapZoom;

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
    return getNearbyShoppingCenters(focusCenter);
  }, [focusCenter]);

  const {
    tenants: mapTenants,
    filtering: majorTenantsFiltering,
  } = useMajorTenantsFilter(proximityTenants, majorTenantsOnly);

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

  const handleShoppingCenterSelect = useCallback((center: ShoppingCenter) => {
    setDirectoryCenter(center);
  }, []);

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
          <PillButton to={`/street/${slug}`} className="map-fullscreen__back">
            ← Back
          </PillButton>
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
          </div>
        ) : null}

        <StaticModeChrome
          staticMode={staticMode}
          onEnter={enterStaticMode}
          onExit={exitStaticMode}
        />

        <TenantMapView
          tenants={mapTenants}
          vacancies={proximityVacancies}
          defaultCenter={mapCenter}
          defaultZoom={mapZoom}
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
          shoppingCenters={shoppingCenters}
          onShoppingCenterSelect={
            staticMode ? undefined : handleShoppingCenterSelect
          }
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
