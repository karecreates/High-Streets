import {
  MarkerClusterer,
  SuperClusterAlgorithm,
} from "@googlemaps/markerclusterer";
import { InfoWindow, Map, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useRef, useState } from "react";
import { USE_LOGO_DEV_MARKERS } from "../config/mapMarkers";
import { MAP_Z_INDEX } from "../config/mapZIndex";
import {
  getMajorTenantLayoutOverride,
  MAJOR_TENANT_KEEP_GROUPED_SLUGS,
  MAJOR_TENANT_MERGE_GROUPS_BY_SLUG,
  MAJOR_TENANT_PACK_BY_SLUG,
  MAJOR_TENANT_SPREAD_BY_SLUG,
  normalizeTenantName,
} from "../data/majorTenants";
import { getTextOnlyLayoutOverride } from "../data/textOnlyLayout";
import type { ShoppingCenter } from "../data/shoppingCenters";
import { useLogoProvider } from "../hooks/useLogoProvider";
import { useMapZoom } from "../hooks/useMapZoom";
import { useOverviewMarkerLayouts } from "../hooks/useOverviewMarkerLayouts";
import type { Tenant } from "../types/tenant";
import type { Vacancy } from "../types/vacancy";
import { createBetaClusterRenderer } from "../utils/createClusterRenderer";
import {
  createCalloutIcon,
  estimateCalloutBoxSize,
} from "../utils/createCalloutIcon";
import {
  createGroupedLogoMarkerIcon,
  estimateGroupedLogoMarkerSize,
} from "../utils/createGroupedLogoMarkerIcon";
import {
  estimateLogoMarkerSize,
  estimateNameCalloutSize,
  type LogoMarkerLayoutOptions,
} from "../utils/createLogoMarkerIcon";
import type { DashboardMapLocation } from "../utils/dashboardMapLocations";
import {
  groupTenantsByLocation,
  mergeTenantGroupsByName,
  splitTenantGroupsForDeconflict,
  spreadCoLocatedAnchors,
  type TenantLocationGroup,
} from "../utils/groupTenantsByLocation";
import { getMapId } from "../utils/mapConfig";
import { MAP_STYLES_WITH_STREET_LABELS } from "../utils/mapStyles";
import {
  resolveStreetLogoLayouts,
  type StreetLogoLayoutItem,
  type StreetLogoLayoutOptions,
} from "../utils/streetLogoLayout";
import { formatTenantDisplayName, isNamedTenant } from "../utils/tenantDisplay";
import {
  getTenantGroupCenterSlugs,
  isTenantGroupCenter,
  resolveTenantGroupCenter,
} from "../utils/tenantGroupCenter";
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

const DEFAULT_FIT_BOUNDS_PADDING = { top: 56, right: 56, bottom: 56, left: 56 };
/** Stable default so ClusteredMarkers does not remount markers every render. */
const EMPTY_FIT_POSITIONS: google.maps.LatLngLiteral[] = [];

/** Cluster until mid street-level; individual markers at 17+ */
const CLUSTER_MAX_ZOOM = 16;
const CLUSTER_RADIUS = 72;

/** Master map: street tenants appear at this zoom and above. */
export const MASTER_MAP_TENANT_REVEAL_ZOOM = 14;

/**
 * Master map: DTLA context logos (FIGat7th, L.A. Live) stay hidden until
 * you've zoomed in past the regional overview.
 */
export const MASTER_MAP_LANDMARK_REVEAL_ZOOM = 15;

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
  /**
   * When set, skip the cloud Map ID and apply these JSON styles instead
   * (needed to hide Google POI icons on a white basemap).
   */
  jsonMapStyles?: google.maps.MapTypeStyle[];
  /** Hide map UI chrome for screenshot / static books capture. */
  staticMode?: boolean;
  /**
   * Keep lat/lng anchors fixed; fan logo boxes with callout stems so none
   * overlap (major-tenant allowlist corridors).
   */
  deconflictLogos?: boolean;
  /** Corridor slug for curated logo placement overrides. */
  deconflictLayoutSlug?: string;
  /**
   * Dense all-occupied packing: compact logos, full-name fallbacks, and a
   * 4-way collision solver. Used when Major Tenants is off on crowded streets.
   */
  deconflictDense?: boolean;
  /**
   * Third Street capture mode: tiny beta-blue name boxes, no logos.
   */
  textOnly?: boolean;
  /**
   * Fires when the map has finished loading tiles and stopped moving.
   * Used by the booklet exporter as one input to its page-ready signal.
   */
  onMapIdle?: () => void;
  /** Fires once every tenant logo callout has been drawn. */
  onIconsReady?: () => void;
  /** Overrides the auto-fit inset (booklet pages need room for callouts). */
  fitBoundsPadding?: google.maps.Padding;
  /** Caps how far auto-fit may zoom in. */
  maxZoom?: number;
  /** Live map instance, for viewport PDF capture. */
  onMapReady?: (map: google.maps.Map) => void;
}

/** Reports the Google Maps `idle` event (tiles drawn, no pending camera move). */
function MapReadySignal({
  onReady,
}: {
  onReady: (map: google.maps.Map) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (map) onReady(map);
  }, [map, onReady]);

  return null;
}

function MapIdleSignal({ onIdle }: { onIdle: () => void }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("idle", () => onIdle());
    return () => listener.remove();
  }, [map, onIdle]);

  return null;
}

function tenantGroupTextLabel(group: TenantLocationGroup): string {
  const centerGroup = resolveTenantGroupCenter(group);
  if (group.tenants.length === 1) {
    return formatTenantDisplayName(group.tenants[0].tenantName);
  }
  if (centerGroup) {
    return `${centerGroup.center.name} · ${centerGroup.tenants.length} tenants`;
  }
  return group.tenants
    .map((tenant) => formatTenantDisplayName(tenant.tenantName))
    .join("\n");
}

async function resolveMarkerIcon(
  group: TenantLocationGroup,
  layout?: LogoMarkerLayoutOptions
): Promise<google.maps.Icon> {
  const placement =
    layout?.placement === "below" ||
    layout?.placement === "left" ||
    layout?.placement === "right"
      ? layout.placement
      : "above";

  if (layout?.textOnly) {
    return createCalloutIcon(tenantGroupTextLabel(group), {
      size: "tiny",
      placement,
      offsetX: layout.offsetX ?? 0,
      showStem: layout.showStem ?? true,
      stemHeight: layout.stemHeight,
      offsetY: layout.stemHeight,
      truncate: true,
      stemColor: "#3E6F7E",
      stemHalo: true,
    });
  }

  const centerGroup = resolveTenantGroupCenter(group);
  if (USE_LOGO_DEV_MARKERS) {
    if (centerGroup) {
      return createGroupedLogoMarkerIcon(
        centerGroup.tenants,
        {
          name: centerGroup.center.name,
          logoUrl: centerGroup.center.logo,
        },
        layout
      );
    }
    return createGroupedLogoMarkerIcon(group.tenants, null, layout);
  }
  const label =
    group.tenants.length === 1
      ? group.tenants[0].tenantName
      : centerGroup
        ? `${centerGroup.center.name} · ${centerGroup.tenants.length} tenants`
        : `${group.tenants.length} tenants`;
  return createCalloutIcon(label, {
    placement,
    offsetX: layout?.offsetX ?? 0,
    showStem: layout?.showStem ?? true,
    stemHeight: layout?.stemHeight,
    offsetY: layout?.stemHeight,
    truncate: false,
  });
}

function estimateGroupMarkerSize(
  group: TenantLocationGroup,
  compact = false,
  scale?: number,
  preferNameFallback = false,
  textOnly = false
): {
  width: number;
  height: number;
} {
  if (textOnly) {
    return estimateCalloutBoxSize(tenantGroupTextLabel(group), "tiny", {
      truncate: true,
    });
  }
  const centerGroup = resolveTenantGroupCenter(group);
  if (centerGroup) {
    return estimateGroupedLogoMarkerSize(centerGroup.tenants.length, {
      hasCenterHeader: true,
      compact,
      nameCells: preferNameFallback,
      scale,
    });
  }
  if (group.tenants.length <= 1) {
    const logoSize = estimateLogoMarkerSize({ compact, scale });
    const tenant = group.tenants[0];
    if (!preferNameFallback || !tenant) return logoSize;
    if (tenant.logoDomain?.trim()) return logoSize;
    return estimateNameCalloutSize(tenant.tenantName, compact);
  }
  return estimateGroupedLogoMarkerSize(group.tenants.length, {
    compact,
    nameCells: preferNameFallback,
    scale,
  });
}

function ClusteredMarkers({
  locationGroups,
  onSelect,
  autoFitBounds,
  defaultCenter,
  defaultZoom,
  extraFitPositions = EMPTY_FIT_POSITIONS,
  deconflictLogos = false,
  deconflictLayoutSlug,
  deconflictDense = false,
  textOnly = false,
  staticMode = false,
  fitBoundsPadding = DEFAULT_FIT_BOUNDS_PADDING,
  onIconsReady,
}: {
  locationGroups: TenantLocationGroup[];
  onSelect: (group: TenantLocationGroup) => void;
  autoFitBounds: boolean;
  defaultCenter?: google.maps.LatLngLiteral;
  defaultZoom?: number;
  extraFitPositions?: google.maps.LatLngLiteral[];
  deconflictLogos?: boolean;
  deconflictLayoutSlug?: string;
  deconflictDense?: boolean;
  textOnly?: boolean;
  staticMode?: boolean;
  fitBoundsPadding?: google.maps.Padding;
  onIconsReady?: () => void;
}) {
  const map = useMap();
  const [logoProvider] = useLogoProvider();
  const markersRef = useRef<google.maps.Marker[]>([]);
  const groupsRef = useRef<TenantLocationGroup[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const listenersRef = useRef<google.maps.MapsEventListener[]>([]);
  const fittedRef = useRef(false);
  const layoutGenRef = useRef(0);
  const lastLayoutZoomRef = useRef<number | null>(null);
  const onSelectRef = useRef(onSelect);
  const onIconsReadyRef = useRef(onIconsReady);
  const applyLayoutsRef = useRef<((force?: boolean) => void) | null>(null);
  const clusterRenderer = useMemo(() => createBetaClusterRenderer(), []);

  onSelectRef.current = onSelect;
  onIconsReadyRef.current = onIconsReady;

  useEffect(() => {
    fittedRef.current = false;
  }, [autoFitBounds]);

  useEffect(() => {
    if (!map) return;

    let cancelled = false;

    clustererRef.current?.clearMarkers();
    clustererRef.current = null;
    listenersRef.current.forEach((l) => l.remove());
    listenersRef.current = [];
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    groupsRef.current = locationGroups;
    lastLayoutZoomRef.current = null;

    if (!locationGroups.length && !extraFitPositions.length) {
      onIconsReadyRef.current?.();
      return;
    }

    const iconWork: Promise<void>[] = [];
    const markers = locationGroups.map((group) => {
      const title =
        group.tenants.length === 1
          ? formatTenantDisplayName(group.tenants[0].tenantName)
          : group.tenants
              .map((t) => formatTenantDisplayName(t.tenantName))
              .join(", ");

      const marker = new google.maps.Marker({
        position: { lat: group.lat, lng: group.lng },
        title,
        optimized: false,
        zIndex: MAP_Z_INDEX.tenantMarker,
        // Attach directly so clustering can't hide deconflicted logos.
        map: deconflictLogos ? map : undefined,
        // Hide default Google pin until the logo callout is ready.
        ...(deconflictLogos
          ? {
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 0,
                fillOpacity: 0,
                strokeOpacity: 0,
              },
            }
          : {}),
      });

      const listener = marker.addListener("click", () => {
        onSelectRef.current(group);
      });
      listenersRef.current.push(listener);

      if (!deconflictLogos) {
        iconWork.push(
          resolveMarkerIcon(group).then((icon) => {
            if (cancelled) return;
            marker.setIcon(icon);
          })
        );
      }

      return marker;
    });

    markersRef.current = markers;

    if (!deconflictLogos) {
      void Promise.all(iconWork).then(() => {
        if (!cancelled) onIconsReadyRef.current?.();
      });
    }

    if (markers.length && !deconflictLogos) {
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
        map.fitBounds(bounds, fitBoundsPadding);
      } else if (defaultCenter) {
        map.setCenter(defaultCenter);
        map.setZoom(defaultZoom ?? 16);
        map.setTilt(0);
        map.setHeading(0);
      }
      fittedRef.current = true;
    }

    const applyDeconflictLayouts = (force = false) => {
      if (!deconflictLogos || cancelled) return;
      const groups = groupsRef.current;
      const currentMarkers = markersRef.current;
      if (!groups.length || currentMarkers.length !== groups.length) return;

      const zoom = map.getZoom();
      if (zoom == null) return;
      // Pan/idle must not reshuffle callouts — only zoom (or first paint).
      if (
        !force &&
        lastLayoutZoomRef.current != null &&
        Math.abs(lastLayoutZoomRef.current - zoom) < 0.001
      ) {
        return;
      }
      lastLayoutZoomRef.current = zoom;

      // Fullscreen / chrome toggles can detach overlays — keep pins on the map.
      currentMarkers.forEach((marker) => {
        if (marker.getMap() !== map) marker.setMap(map);
      });
      if (textOnly) {
        map.setTilt(0);
        map.setHeading(0);
      }

      const compact = false;
      const preferNameFallback = deconflictDense && !textOnly;
      const markerScale = deconflictDense && !textOnly ? 1.2 : undefined;
      const pack = deconflictLayoutSlug
        ? MAJOR_TENANT_PACK_BY_SLUG[deconflictLayoutSlug]
        : undefined;
      const layoutOptions: StreetLogoLayoutOptions | undefined = textOnly
        ? {
            textOnlyPack: true,
            allowSidePlacement: true,
            allowAutoOffsetX: true,
            // Abbot Kinney runs diagonally — fan labels into the empty
            // blocks above/below the corridor with longer leaders, unlike
            // the Promenade's left/right columns.
            maxStem: deconflictLayoutSlug === "abbot-kinney" ? 380 : 132,
            preferredSides:
              deconflictLayoutSlug === "abbot-kinney"
                ? ["above", "below"]
                : undefined,
          }
        : deconflictDense
          ? {
              allowSidePlacement: true,
              allowAutoOffsetX: true,
              relaxForcedStems: true,
              maxStem: 480,
            }
          : pack
            ? {
                preferredSides:
                  pack.sides === "horizontal"
                    ? ["left", "right"]
                    : ["above", "below"],
                maxStem: pack.maxStem,
              }
            : undefined;

      const items: StreetLogoLayoutItem[] = groups.map((group) => {
        const override = textOnly
          ? getTextOnlyLayoutOverride(
              deconflictLayoutSlug,
              group.tenants.map((t) => t.tenantName)
            )
          : deconflictDense
            ? null
            : getMajorTenantLayoutOverride(
                deconflictLayoutSlug,
                group.tenants.map((t) => t.tenantName)
              );
        const size = estimateGroupMarkerSize(
          group,
          compact,
          override?.scale,
          preferNameFallback,
          textOnly
        );
        return {
          id: group.key,
          position: { lat: group.lat, lng: group.lng },
          width: size.width,
          height: size.height,
          forcePlacement: override?.placement,
          forceOffsetX: override?.offsetX,
          forceStemHeight: override?.stemHeight,
        };
      });

      const layouts = resolveStreetLogoLayouts(map, items, layoutOptions);

      const gen = ++layoutGenRef.current;
      const iconWork = groups.map((group, index) => {
        const marker = currentMarkers[index];
        if (!marker) return Promise.resolve();
        const layout = layouts[group.key];
        const override = textOnly
          ? getTextOnlyLayoutOverride(
              deconflictLayoutSlug,
              group.tenants.map((t) => t.tenantName)
            )
          : deconflictDense
            ? null
            : getMajorTenantLayoutOverride(
                deconflictLayoutSlug,
                group.tenants.map((t) => t.tenantName)
              );
        return resolveMarkerIcon(group, {
          placement: layout?.placement ?? "above",
          offsetX: layout?.offsetX ?? 0,
          stemHeight: layout?.stemHeight,
          showStem: true,
          scale: override?.scale ?? markerScale,
          compact,
          preferNameFallback,
          textOnly,
        }).then((icon) => {
          if (cancelled || layoutGenRef.current !== gen) return;
          marker.setIcon(icon);
          if (marker.getMap() !== map) marker.setMap(map);
        });
      });
      void Promise.all(iconWork).then(() => {
        if (cancelled || layoutGenRef.current !== gen) return;
        onIconsReadyRef.current?.();
      });
    };

    applyLayoutsRef.current = applyDeconflictLayouts;

    let zoomListener: google.maps.MapsEventListener | null = null;
    if (deconflictLogos) {
      // Wait for projection, then lay out once — do not listen to idle/pan.
      const boot = () => {
        if (cancelled) return;
        if (!map.getProjection()) {
          google.maps.event.addListenerOnce(map, "projection_changed", boot);
          return;
        }
        applyDeconflictLayouts(true);
      };
      boot();
      zoomListener = map.addListener("zoom_changed", () => {
        applyDeconflictLayouts(false);
      });
    }

    return () => {
      cancelled = true;
      applyLayoutsRef.current = null;
      zoomListener?.remove();
      clustererRef.current?.clearMarkers();
      clustererRef.current = null;
      listenersRef.current.forEach((l) => l.remove());
      listenersRef.current = [];
      markersRef.current.forEach((m) => m.setMap(null));
    };
  }, [
    map,
    locationGroups,
    autoFitBounds,
    defaultCenter,
    defaultZoom,
    clusterRenderer,
    extraFitPositions,
    logoProvider,
    deconflictLogos,
    deconflictLayoutSlug,
    deconflictDense,
    textOnly,
  ]);

  // Static/fullscreen chrome changes must not wipe markers — re-attach + redraw.
  useEffect(() => {
    if (!map || !deconflictLogos) return;
    markersRef.current.forEach((marker) => {
      if (marker.getMap() !== map) marker.setMap(map);
    });
    // After fullscreen transition, wait a tick then force layout/icons again.
    const timer = window.setTimeout(() => {
      applyLayoutsRef.current?.(true);
    }, 100);
    return () => window.clearTimeout(timer);
  }, [map, deconflictLogos, staticMode]);

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
  extraFitPositions = EMPTY_FIT_POSITIONS,
  zoomGatedStreetMarkers = false,
  corridorCallouts = [],
  onCorridorCalloutSelect,
  alwaysShowCorridorCallouts = false,
  forceShowStreetMarkers = false,
  staticMode = false,
  deconflictLogos = false,
  deconflictLayoutSlug,
  deconflictDense = false,
  textOnly = false,
  fitBoundsPadding,
  onIconsReady,
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
  const landmarksVisible =
    !zoomGatedStreetMarkers ||
    forceShowStreetMarkers ||
    (zoom != null && zoom >= MASTER_MAP_LANDMARK_REVEAL_ZOOM);
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
  const locationGroups = useMemo(() => {
    const grouped = groupTenantsByLocation(mapTenants);
    // Text Only uses the same one-callout-per-address groups as all-tenants logos.
    if (textOnly) return grouped;
    // All-tenants Third Street keeps one callout per address.
    // Other curated major-tenant corridors keep the split layout.
    const splitForDeconflict = deconflictLogos && !deconflictDense;
    if (!splitForDeconflict) return grouped;
    // Abbot Kinney / Montana keep co-located brands on one grouped pin (Away +
    // Blue Bottle, Casper + Geek Eyewear), and Montana also folds a few
    // near-neighbours into one stacked callout.
    if (deconflictLayoutSlug && MAJOR_TENANT_KEEP_GROUPED_SLUGS.has(deconflictLayoutSlug)) {
      const merges = MAJOR_TENANT_MERGE_GROUPS_BY_SLUG[deconflictLayoutSlug];
      return merges
        ? mergeTenantGroupsByName(grouped, merges, normalizeTenantName)
        : grouped;
    }
    const split = splitTenantGroupsForDeconflict(
      grouped,
      isTenantGroupCenter
    );
    const spread =
      deconflictLayoutSlug &&
      MAJOR_TENANT_SPREAD_BY_SLUG[deconflictLayoutSlug];
    if (spread) return spreadCoLocatedAnchors(split, spread);
    return split;
  }, [
    mapTenants,
    deconflictLogos,
    deconflictLayoutSlug,
    deconflictDense,
    textOnly,
  ]);
  const vacancyGroups = useMemo(
    () => groupVacanciesByLocation(vacancies),
    [vacancies]
  );

  const shoppingCenterPins = useMemo(() => {
    const headedSlugs = showTenants
      ? getTenantGroupCenterSlugs(locationGroups)
      : new Set<string>();
    return shoppingCenters.filter((center) => {
      if (center.mapPinOnly && !landmarksVisible) return false;
      if (center.mapPinOnly && headedSlugs.has(center.slug)) return false;
      return true;
    });
  }, [locationGroups, shoppingCenters, showTenants, landmarksVisible]);

  const layoutCorridors = corridorCalloutsVisible ? corridorCallouts : [];
  const { layouts } = useOverviewMarkerLayouts(
    layoutCorridors,
    shoppingCenterPins
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
          deconflictLogos={deconflictLogos}
          deconflictLayoutSlug={deconflictLayoutSlug}
          deconflictDense={deconflictDense}
          textOnly={textOnly}
          staticMode={staticMode}
          fitBoundsPadding={fitBoundsPadding}
          onIconsReady={onIconsReady}
        />
      ) : null}
      {corridorCalloutsVisible && onCorridorCalloutSelect ? (
        <MasterCorridorCalloutsLayer
          locations={corridorCallouts}
          onSelect={onCorridorCalloutSelect}
          layouts={layouts}
        />
      ) : null}
      {shoppingCenterPins.length ? (
        <ShoppingCenterPinsLayer
          centers={shoppingCenterPins}
          onSelect={onShoppingCenterSelect ?? (() => undefined)}
          layouts={layouts}
          interactive={!staticMode && Boolean(onShoppingCenterSelect)}
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
          <GroupedInfoWindowContent
            tenants={selected.tenants}
            address={selected.address}
          />
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
  extraFitPositions = EMPTY_FIT_POSITIONS,
  zoomGatedStreetMarkers = false,
  corridorCallouts = [],
  onCorridorCalloutSelect,
  alwaysShowCorridorCallouts = false,
  forceShowStreetMarkers = false,
  mapIdOverride,
  jsonMapStyles,
  staticMode = false,
  deconflictLogos = false,
  deconflictLayoutSlug,
  deconflictDense = false,
  textOnly = false,
  onMapIdle,
  onIconsReady,
  fitBoundsPadding,
  maxZoom,
  onMapReady,
}: TenantMapViewProps) {
  const mapId = jsonMapStyles ? undefined : mapIdOverride ?? getMapId();
  const useCloudStyle = Boolean(mapId) && !jsonMapStyles;
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
        clickableIcons={false}
        zoomControl={!staticMode}
        fullscreenControl={!embedded && !staticMode}
        mapTypeControl={false}
        streetViewControl={false}
        defaultHeading={0}
        defaultTilt={0}
        {...(staticMode ? { heading: 0, tilt: 0 } : {})}
        {...(maxZoom != null ? { maxZoom } : {})}
        {...(useCloudStyle
          ? {}
          : { styles: jsonMapStyles ?? MAP_STYLES_WITH_STREET_LABELS })}
      >
        {introZoom ? (
          <MapIntroZoom target={introZoom} onComplete={onIntroZoomComplete} />
        ) : null}
        {onMapReady ? <MapReadySignal onReady={onMapReady} /> : null}
        {onMapIdle ? <MapIdleSignal onIdle={onMapIdle} /> : null}
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
          deconflictLogos={deconflictLogos}
          deconflictLayoutSlug={deconflictLayoutSlug}
          deconflictDense={deconflictDense}
          textOnly={textOnly}
          fitBoundsPadding={fitBoundsPadding}
          onIconsReady={onIconsReady}
        />
      </Map>
    </div>
  );
}
