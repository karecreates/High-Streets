import { useCallback, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  MapControlsBar,
  type MapDisplayMode,
} from "../components/MapControlsBar";
import { MajorTenantsToggle } from "../components/MajorTenantsToggle";
import { PillButton } from "../components/PillButton";
import { StaticModeChrome } from "../components/StaticModeChrome";
import { TenantMapView } from "../components/TenantMap";
import { useStreetTenants, useStreetVacancies } from "../context/TenantsContext";
import { useMajorTenantsFilter } from "../hooks/useMajorTenantsFilter";
import { useStaticMapMode } from "../hooks/useStaticMapMode";
import { getCorridorBySlug, getCorridorDetail } from "../data/highStreets";
import { getMasterMapId } from "../utils/mapConfig";
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
  const tenants = useStreetTenants(corridor?.dataKey ?? "");
  const vacancies = useStreetVacancies(corridor?.dataKey ?? "");
  const [displayMode, setDisplayMode] = useState<MapDisplayMode>("both");
  const [majorTenantsOnly, setMajorTenantsOnly] = useState(false);
  const [showMeteredParking, setShowMeteredParking] = useState(true);
  const [showParkingLots, setShowParkingLots] = useState(false);
  const [focusedVacancyGroupKey, setFocusedVacancyGroupKey] = useState<
    string | null
  >(null);
  const [introZoomComplete, setIntroZoomComplete] = useState(
    () => !locationState?.introZoom
  );
  const mapFrameRef = useRef<HTMLDivElement>(null);
  const { staticMode, enterStaticMode, exitStaticMode } =
    useStaticMapMode(mapFrameRef);

  const {
    tenants: mapTenants,
    filtering: majorTenantsFiltering,
    majorCount,
  } = useMajorTenantsFilter(tenants, majorTenantsOnly);

  const introTarget = useMemo(() => {
    if (!locationState?.introZoom) return null;
    return {
      center: locationState.center ?? detail?.mapCenter ?? { lat: 0, lng: 0 },
      zoom: locationState.zoom ?? detail?.mapZoom ?? 18,
    };
  }, [detail?.mapCenter, detail?.mapZoom, locationState]);

  const mapCenter = introTarget?.center ?? detail?.mapCenter;
  const mapZoom = introTarget?.center ? introTarget.zoom : detail?.mapZoom;

  const vacancyGroups = useMemo(
    () => groupVacanciesByLocation(vacancies),
    [vacancies]
  );

  const tenantsCount = useMemo(() => {
    if (majorTenantsOnly) return majorCount;
    return tenants.filter(
      (tenant) =>
        tenant.lat != null &&
        tenant.lng != null &&
        isNamedTenant(tenant.tenantName)
    ).length;
  }, [majorCount, majorTenantsOnly, tenants]);

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
          vacancies={vacancies}
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
        />
      </div>
    </div>
  );
}
