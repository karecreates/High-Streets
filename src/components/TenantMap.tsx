import {
  MarkerClusterer,
  SuperClusterAlgorithm,
} from "@googlemaps/markerclusterer";
import { InfoWindow, Map, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useRef, useState } from "react";
import { USE_LOGO_DEV_MARKERS } from "../config/mapMarkers";
import { MAP_Z_INDEX } from "../config/mapZIndex";
import type { ShoppingCenter } from "../data/shoppingCenters";
import { useLogoProvider } from "../hooks/useLogoProvider";
import { useMapZoom } from "../hooks/useMapZoom";
import type { Tenant } from "../types/tenant";
import type { Vacancy } from "../types/vacancy";
import { createBetaClusterRenderer } from "../utils/createClusterRenderer";
import { createCalloutIcon } from "../utils/createCalloutIcon";
import { createGroupedLogoMarkerIcon } from "../utils/createGroupedLogoMarkerIcon";
import type { DashboardMapLocation } from "../utils/dashboardMapLocations";
import {
  groupTenantsByLocation,
  type TenantLocationGroup,
} from "../utils/groupTenantsByLocation";
import { getMapId } from "../utils/mapConfig";
import { MAP_STYLES_WITH_STREET_LABELS } from "../utils/mapStyles";
import { isNamedTenant } from "../utils/tenantDisplay";
import { groupVacanciesByLocation } from "../utils/groupVacanciesByLocation";
import { GroupedInfoWindowContent } from "./GroupedInfoWindowContent";
import type { MapDisplayMode } from "./MapControlsBar";
import { LACountyParkingLotsLayer } from "./LACountyParkingLotsLayer";
import { LADOTParkingLayer } from "./LADOTParkingLayer";
import { MapFocus, type MapFocusTarget } from "./MapFocus";
import { MapIntroZoom, type MapIntroTarget } from "./MapIntroZoom";
import { MapChromeVisibility } from "./MapChromeVisibility";
import { MasterCorridorCalloutsLayer } from "./MasterCorridorCalloutsLayer";
import { ShoppingCenterPinsLayer } from "./ShoppingCenterPinsLayer";
import { StreetViewControl } from "./StreetViewControl";
import { VacancyMarkers } from "./VacancyMarkers";
import { MapTypeToggle } from "./MapTypeToggle";

const CALIFORNIA_CENTER = { lat: 36.7783, lng: -119.4179 };
const DEFAULT_ZOOM = 6;

/** Cluster until mid street-level; individual markers at 17+ */
const CLUSTER_MAX_ZOOM = 16;
const CLUSTER_RADIUS = 72;

/** Master map: street tenants appear at this zoom and above. */
export const MASTER_MAP_TENANT_REVEAL_ZOOM = 14;

export interface TenantMapViewProps {
  tenants: Tenant[];
  vacancies?: Vacancy[];
  defaultCenter?: google.maps.LatLngLiteral;
  defaultZoom?: number;
  /** When true, fit bounds to tenants on load (when mapFocus is not set) */
  autoFitBounds?: boolean;
  /** Pan/zoom when corridor or filter changes */
  mapFocus?: MapFocusTarget | null;
  embedded?: boolean;
  /** Which marker layers to show (default: both) */
  displayMode?: MapDisplayMode;
  /** Pan to a vacancy marker and open its popup */
  focusedVacancyGroupKey?: string | null;
  onVacancyFocusComplete?: () => void;
  /** Show LADOT metered street parking layer */
  showMeteredParking?: boolean;
  /** Show LA County parking lot polygons */
  showParkingLots?: boolean;
  /** Cinematic zoom when entering from the access gate */
  introZoom?: MapIntroTarget;
  onIntroZoomComplete?: () => void;
  /** Shopping center logo pins (master map) */
  shoppingCenters?: ShoppingCenter[];
  onShoppingCenterSelect?: (center: ShoppingCenter) => void;
  /** Extra lat/lngs to include when auto-fitting bounds (e.g. center logos) */
  extraFitPositions?: google.maps.LatLngLiteral[];
  /**
   * Master map: hide street tenants/vacancies until zoomed in;
   * show high-street / district callouts while zoomed out.
   */
  zoomGatedStreetMarkers?: boolean;
  corridorCallouts?: DashboardMapLocation[];
  onCorridorCalloutSelect?: (slug: string) => void;
  /**
   * Dedicated maps: keep street/district callouts visible at all zooms
   * (alongside the current corridor's tenant markers).
   */
  alwaysShowCorridorCallouts?: boolean;
  /** Bypass zoom gate (e.g. active tenant search). */
  forceShowStreetMarkers?: boolean;
  /**
   * Optional Map ID override (cloud-styled interactive map).
   * When set, JSON `styles` are omitted so the cloud style can apply.
   */
  mapIdOverride?: string;
  /** Hide map UI chrome for screenshot / static books capture. */
  staticMode?: boolean;
}

async function resolveMarkerIcon(
  group: TenantLocationGroup
): Promise<google.maps.Icon> {
  if (USE_LOGO_DEV_MARKERS) {
    return createGroupedLogoMarkerIcon(group.tenants);
  }
  const label =
    group.tenants.length === 1
      ? group.tenants[0].tenantName
      : `${group.tenants.length} tenants`;
  return createCalloutIcon(label);
}

function ClusteredMarkers({
  locationGroups,
  onSelect,
  autoFitBounds,
  defaultCenter,
  defaultZoom,
  extraFitPositions = [],
}: {
  locationGroups: TenantLocationGroup[];
  onSelect: (group: TenantLocationGroup) => void;
  autoFitBounds: boolean;
  defaultCenter?: google.maps.LatLngLiteral;
  defaultZoom?: number;
  extraFitPositions?: google.maps.LatLngLiteral[];
}) {
  const map = useMap();
  const [logoProvider] = useLogoProvider();
  const markersRef = useRef<google.maps.Marker[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const listenersRef = useRef<google.maps.MapsEventListener[]>([]);
  const fittedRef = useRef(false);
  const clusterRenderer = useMemo(() => createBetaClusterRenderer(), []);

  useEffect(() => {
    fittedRef.current = false;
  }, [autoFitBounds]);

  useEffect(() => {
    if (!map) return;

    let cancelled = false;

    clustererRef.current?.clearMarkers();
    listenersRef.current.forEach((l) => l.remove());
    listenersRef.current = [];
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (!locationGroups.length && !extraFitPositions.length) return;

    const markers = locationGroups.map((group) => {
      const title =
        group.tenants.length === 1
          ? group.tenants[0].tenantName
          : group.tenants.map((t) => t.tenantName).join(", ");

      const marker = new google.maps.Marker({
        position: { lat: group.lat, lng: group.lng },
        title,
        optimized: false,
        zIndex: MAP_Z_INDEX.tenantMarker,
      });

      const listener = marker.addListener("click", () => onSelect(group));
      listenersRef.current.push(listener);

      resolveMarkerIcon(group).then((icon) => {
        if (!cancelled) marker.setIcon(icon);
      });

      return marker;
    });

    markersRef.current = markers;

    if (markers.length) {
      clustererRef.current = new MarkerClusterer({
        map,
        markers,
        algorithm: new SuperClusterAlgorithm({
          maxZoom: CLUSTER_MAX_ZOOM,
          radius: CLUSTER_RADIUS,
        }),
        renderer: clusterRenderer,
        onClusterClick: (_event, cluster, clusterMap) => {
          if (cluster.bounds) {
            clusterMap.fitBounds(cluster.bounds, {
              top: 56,
              right: 56,
              bottom: 56,
              left: 56,
            });
          }
        },
      });
    }

    if (!fittedRef.current) {
      const fitPoints = [
        ...locationGroups.map((g) => ({ lat: g.lat, lng: g.lng })),
        ...extraFitPositions,
      ];
      if (autoFitBounds && fitPoints.length >= 1) {
        const bounds = new google.maps.LatLngBounds();
        fitPoints.forEach((point) => bounds.extend(point));
        map.fitBounds(bounds, { top: 56, right: 56, bottom: 56, left: 56 });
      } else if (defaultCenter) {
        map.setCenter(defaultCenter);
        map.setZoom(defaultZoom ?? 16);
      }
      fittedRef.current = true;
    }

    return () => {
      cancelled = true;
      clustererRef.current?.clearMarkers();
      listenersRef.current.forEach((l) => l.remove());
      listenersRef.current = [];
      markersRef.current.forEach((m) => m.setMap(null));
    };
  }, [
    map,
    locationGroups,
    onSelect,
    autoFitBounds,
    defaultCenter,
    defaultZoom,
    clusterRenderer,
    extraFitPositions,
    logoProvider,
  ]);

  return null;
}

function MapWithTenants({
  tenants,
  vacancies = [],
  autoFitBounds,
  defaultCenter,
  defaultZoom,
  mapFocus,
  displayMode = "both",
  focusedVacancyGroupKey = null,
  onVacancyFocusComplete,
  showMeteredParking = false,
  showParkingLots = false,
  shoppingCenters = [],
  onShoppingCenterSelect,
  extraFitPositions = [],
  zoomGatedStreetMarkers = false,
  corridorCallouts = [],
  onCorridorCalloutSelect,
  alwaysShowCorridorCallouts = false,
  forceShowStreetMarkers = false,
  staticMode = false,
}: TenantMapViewProps) {
  const [selected, setSelected] = useState<TenantLocationGroup | null>(null);
  const zoom = useMapZoom();

  useEffect(() => {
    if (staticMode) setSelected(null);
  }, [staticMode]);
  const streetMarkersVisible =
    !zoomGatedStreetMarkers ||
    forceShowStreetMarkers ||
    (zoom != null && zoom >= MASTER_MAP_TENANT_REVEAL_ZOOM);
  const corridorCalloutsVisible =
    corridorCallouts.length > 0 &&
    (alwaysShowCorridorCallouts ||
      (zoomGatedStreetMarkers &&
        !forceShowStreetMarkers &&
        (zoom == null || zoom < MASTER_MAP_TENANT_REVEAL_ZOOM)));

  const showTenants = displayMode !== "vacancies" && streetMarkersVisible;
  const showVacancies = displayMode !== "tenants" && streetMarkersVisible;
  const mapTenants = useMemo(
    () =>
      tenants.filter(
        (t) => t.lat != null && t.lng != null && isNamedTenant(t.tenantName)
      ),
    [tenants]
  );
  const locationGroups = useMemo(
    () => groupTenantsByLocation(mapTenants),
    [mapTenants]
  );
  const vacancyGroups = useMemo(
    () => groupVacanciesByLocation(vacancies),
    [vacancies]
  );

  return (
    <>
      <MapFocus focus={mapFocus} />
      <MapChromeVisibility visible={!staticMode} />
      {!staticMode ? <MapTypeToggle /> : null}
      {!staticMode ? <StreetViewControl /> : null}
      {showTenants || extraFitPositions.length ? (
        <ClusteredMarkers
          locationGroups={showTenants ? locationGroups : []}
          onSelect={staticMode ? () => undefined : setSelected}
          autoFitBounds={autoFitBounds ?? true}
          defaultCenter={mapFocus?.center ?? defaultCenter}
          defaultZoom={mapFocus?.zoom ?? defaultZoom}
          extraFitPositions={extraFitPositions}
        />
      ) : null}
      {corridorCalloutsVisible && onCorridorCalloutSelect ? (
        <MasterCorridorCalloutsLayer
          locations={corridorCallouts}
          onSelect={onCorridorCalloutSelect}
        />
      ) : null}
      {shoppingCenters.length && onShoppingCenterSelect ? (
        <ShoppingCenterPinsLayer
          centers={shoppingCenters}
          onSelect={onShoppingCenterSelect}
        />
      ) : null}
      {showVacancies ? (
        <VacancyMarkers
          locationGroups={vacancyGroups}
          focusGroupKey={focusedVacancyGroupKey}
          onFocusComplete={onVacancyFocusComplete}
          staticMode={staticMode}
        />
      ) : null}
      {showMeteredParking ? <LADOTParkingLayer enabled /> : null}
      {showParkingLots ? <LACountyParkingLotsLayer enabled /> : null}
      {selected && showTenants && !staticMode ? (
        <InfoWindow
          position={{ lat: selected.lat, lng: selected.lng }}
          onCloseClick={() => setSelected(null)}
          onClose={() => setSelected(null)}
          maxWidth={360}
          zIndex={MAP_Z_INDEX.tenantInfo}
        >
          <GroupedInfoWindowContent tenants={selected.tenants} />
        </InfoWindow>
      ) : null}
    </>
  );
}

export function TenantMapView({
  tenants,
  vacancies = [],
  defaultCenter = CALIFORNIA_CENTER,
  defaultZoom = DEFAULT_ZOOM,
  autoFitBounds = true,
  mapFocus = null,
  embedded = false,
  displayMode = "both",
  focusedVacancyGroupKey = null,
  onVacancyFocusComplete,
  showMeteredParking = false,
  showParkingLots = false,
  introZoom,
  onIntroZoomComplete,
  shoppingCenters = [],
  onShoppingCenterSelect,
  extraFitPositions = [],
  zoomGatedStreetMarkers = false,
  corridorCallouts = [],
  onCorridorCalloutSelect,
  alwaysShowCorridorCallouts = false,
  forceShowStreetMarkers = false,
  mapIdOverride,
  staticMode = false,
}: TenantMapViewProps) {
  const mapId = mapIdOverride ?? getMapId();
  const useCloudStyle = Boolean(mapIdOverride);
  const shouldAutoFit = autoFitBounds && !mapFocus;
  const mapTenants = tenants.filter(
    (t) => t.lat != null && t.lng != null && isNamedTenant(t.tenantName)
  );
  const mappedVacancies = vacancies.filter((v) => v.lat != null && v.lng != null);
  const vacancyGroups = groupVacanciesByLocation(mappedVacancies);
  const showTenants = displayMode !== "vacancies";
  const showVacancies = displayMode !== "tenants";
  const hasVisibleMarkers =
    (showTenants && mapTenants.length > 0) ||
    (showVacancies && vacancyGroups.length > 0) ||
    shoppingCenters.length > 0 ||
    corridorCallouts.length > 0;

  return (
    <div
      className={`map-shell ${embedded ? "map-shell--embedded" : ""}${
        staticMode ? " map-shell--static" : ""
      }`}
    >
      {!hasVisibleMarkers && !staticMode ? (
        <div className="map-empty-overlay">
          <p>
            {displayMode === "vacancies"
              ? "No mapped vacancies for this corridor."
              : displayMode === "tenants"
                ? "No mapped tenants for this corridor."
                : "No mapped tenants or vacancies for this corridor."}
          </p>
        </div>
      ) : null}

      <Map
        className="map-canvas"
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
        {...(mapId ? { mapId } : {})}
        gestureHandling="greedy"
        zoomControl={!staticMode}
        fullscreenControl={!embedded && !staticMode}
        mapTypeControl={false}
        streetViewControl={false}
        {...(useCloudStyle ? {} : { styles: MAP_STYLES_WITH_STREET_LABELS })}
      >
        {introZoom ? (
          <MapIntroZoom target={introZoom} onComplete={onIntroZoomComplete} />
        ) : null}
        <MapWithTenants
          tenants={tenants}
          vacancies={vacancies}
          defaultCenter={defaultCenter}
          defaultZoom={defaultZoom}
          autoFitBounds={shouldAutoFit}
          mapFocus={mapFocus}
          displayMode={displayMode}
          focusedVacancyGroupKey={focusedVacancyGroupKey}
          onVacancyFocusComplete={onVacancyFocusComplete}
          showMeteredParking={showMeteredParking}
          showParkingLots={showParkingLots}
          shoppingCenters={shoppingCenters}
          onShoppingCenterSelect={onShoppingCenterSelect}
          extraFitPositions={extraFitPositions}
          zoomGatedStreetMarkers={zoomGatedStreetMarkers}
          corridorCallouts={corridorCallouts}
          onCorridorCalloutSelect={onCorridorCalloutSelect}
          alwaysShowCorridorCallouts={alwaysShowCorridorCallouts}
          forceShowStreetMarkers={forceShowStreetMarkers}
          staticMode={staticMode}
        />
      </Map>
    </div>
  );
}
