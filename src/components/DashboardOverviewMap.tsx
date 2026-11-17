import { Map, useMap } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MAP_Z_INDEX } from "../config/mapZIndex";
import type { ShoppingCenter } from "../data/shoppingCenters";
import { createCalloutIcon } from "../utils/createCalloutIcon";
import { createShoppingCenterMarkerIcon } from "../utils/createShoppingCenterMarkerIcon";
import {
  getActiveDashboardMapLocations,
  type DashboardMapLocation,
} from "../utils/dashboardMapLocations";
import { getActiveShoppingCenters } from "../utils/mapContextOverlays";
import { getMasterMapId } from "../utils/mapConfig";
import { MAP_STYLES_DASHBOARD_BASE_LABELS } from "../utils/mapStyles";
import { useDashboardMarkerLayouts } from "../hooks/useDashboardMarkerLayouts";
import { StreetViewControl } from "./StreetViewControl";
import { DashboardMapHeroOverlay } from "./DashboardMapHeroOverlay";

const DEFAULT_CENTER = { lat: 34.04, lng: -118.42 };
const DEFAULT_ZOOM = 11.45;
/** Room for compact pills / logos above/below pins without clipping the map frame. */
const FIT_BOUNDS_PADDING = {
  top: 64,
  right: 56,
  bottom: 168,
  left: 56,
};

/** Web Mercator y, so vertical spans can be compared across latitudes. */
function mercatorY(lat: number): number {
  const clamped = Math.max(-85, Math.min(85, lat));
  return Math.log(Math.tan(Math.PI / 4 + (clamped * Math.PI) / 360));
}

/**
 * `fitBounds` snaps to whole zoom levels, which on a printed page can leave
 * close to half the sheet empty. Google Maps accepts fractional zoom, so close
 * the gap between the snapped level and the level the selection actually needs.
 */
function tightenZoom(
  map: google.maps.Map,
  target: google.maps.LatLngBounds,
  padding: typeof FIT_BOUNDS_PADDING,
  viewport: { width: number; height: number }
): void {
  const current = map.getBounds();
  const zoom = map.getZoom();
  if (!current || zoom == null) return;

  const usableWidth = viewport.width - padding.left - padding.right;
  const usableHeight = viewport.height - padding.top - padding.bottom;
  if (usableWidth <= 0 || usableHeight <= 0) return;

  const currentLng =
    current.getNorthEast().lng() - current.getSouthWest().lng();
  const targetLng = target.getNorthEast().lng() - target.getSouthWest().lng();
  const currentY =
    mercatorY(current.getNorthEast().lat()) -
    mercatorY(current.getSouthWest().lat());
  const targetY =
    mercatorY(target.getNorthEast().lat()) -
    mercatorY(target.getSouthWest().lat());
  if (targetLng <= 0 || targetY <= 0) return;

  const slack = Math.min(
    (currentLng * (usableWidth / viewport.width)) / targetLng,
    (currentY * (usableHeight / viewport.height)) / targetY
  );
  if (!Number.isFinite(slack) || slack <= 1.02) return;

  map.setZoom(zoom + Math.log2(slack));
  map.setCenter(target.getCenter());
}

function FitDashboardBounds({
  corridorLocations,
  shoppingCenters,
  padding,
  tighten = false,
  onFitted,
}: {
  corridorLocations: DashboardMapLocation[];
  shoppingCenters: ShoppingCenter[];
  padding: typeof FIT_BOUNDS_PADDING;
  /** Presentation pages trade interactivity for a tightly framed selection. */
  tighten?: boolean;
  onFitted: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Live dashboard: a tighter LA overview. Fitting every corridor
    // (Malibu through Costa Mesa) zooms out too far.
    if (!tighten) {
      map.setCenter(DEFAULT_CENTER);
      map.setZoom(DEFAULT_ZOOM);
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        idleListener.remove();
        window.clearTimeout(fallback);
        onFitted();
      };
      const idleListener = map.addListener("idle", finish);
      // Same camera as defaultCenter/defaultZoom — idle may already have fired.
      const fallback = window.setTimeout(finish, 0);
      return () => {
        idleListener.remove();
        window.clearTimeout(fallback);
      };
    }

    const positions = [
      ...corridorLocations.map((location) => location.position),
      ...shoppingCenters.map((center) => center.mapCenter),
    ];
    if (positions.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    for (const position of positions) {
      bounds.extend(position);
    }

    let refined = !tighten || positions.length === 1;
    const idleListener = map.addListener("idle", () => {
      if (!refined) {
        refined = true;
        const frame = map.getDiv();
        tightenZoom(map, bounds, padding, {
          width: frame.clientWidth,
          height: frame.clientHeight,
        });
        return;
      }
      idleListener.remove();
      onFitted();
    });

    if (positions.length === 1) {
      // fitBounds on a single point zooms to the maximum level.
      map.setCenter(positions[0]);
      map.setZoom(14);
    } else {
      map.fitBounds(bounds, padding);
    }

    return () => {
      idleListener.remove();
    };
  }, [map, corridorLocations, shoppingCenters, onFitted, padding, tighten]);

  return null;
}

/** Google sometimes paints a satellite hole over water. Hide that card. */
function HideMapImageryErrors() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const root = map.getDiv();
    const hide = () => {
      root.querySelectorAll(".gm-err-container").forEach((node) => {
        (node as HTMLElement).style.setProperty("display", "none", "important");
      });
    };
    hide();
    const observer = new MutationObserver(hide);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [map]);

  return null;
}

/** Resolves once tiles are drawn and the camera has come to rest. */
function MapSettled({ onSettled }: { onSettled: () => void }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    let tilesLoaded = false;
    let idle = false;

    const check = () => {
      if (tilesLoaded && idle) onSettled();
    };

    const tilesListener = map.addListener("tilesloaded", () => {
      tilesLoaded = true;
      check();
    });
    const idleListener = map.addListener("idle", () => {
      idle = true;
      check();
    });
    const fallback = window.setTimeout(() => onSettled(), 8000);

    return () => {
      tilesListener.remove();
      idleListener.remove();
      window.clearTimeout(fallback);
    };
  }, [map, onSettled]);

  return null;
}

function OverviewMarkers({
  corridors,
  centers,
  interactive,
  fitted,
  onCenterSelect,
  onIconsResolved,
}: {
  corridors: DashboardMapLocation[];
  centers: ShoppingCenter[];
  interactive: boolean;
  fitted: boolean;
  onCenterSelect: (center: ShoppingCenter) => void;
  /** Fires once every shopping-center logo icon has been painted. */
  onIconsResolved?: () => void;
}) {
  const map = useMap();
  const navigate = useNavigate();
  const layouts = useDashboardMarkerLayouts(
    corridors,
    centers,
    interactive ? true : fitted
  );

  useEffect(() => {
    if (!map) return;

    const markers: google.maps.Marker[] = [];
    const listeners: google.maps.MapsEventListener[] = [];
    const iconWork: Promise<unknown>[] = [];
    let cancelled = false;

    for (const location of corridors) {
      const layout = layouts?.[`corridor:${location.slug}`] ?? {
        placement: location.labelPlacement ?? "above",
        stemHeight: 16,
      };
      try {
        const marker = new google.maps.Marker({
          position: location.position,
          map,
          icon: createCalloutIcon(location.label, {
            size: "compact",
            showStem: true,
            showAnchorDot: false,
            placement: layout.placement,
            stemHeight: layout.stemHeight,
            stemColor: "#3E6F7E",
            stemHalo: false,
          }),
          optimized: false,
          zIndex: MAP_Z_INDEX.tenantMarker,
          title: location.name,
          clickable: interactive,
        });
        if (interactive) {
          listeners.push(
            marker.addListener("click", () => {
              navigate(location.detailPath);
            })
          );
        }
        markers.push(marker);
      } catch (error) {
        console.error("Overview corridor marker failed", location.slug, error);
      }
    }

    for (const center of centers) {
      const layout = layouts?.[`center:${center.slug}`] ?? {
        placement: center.masterMapLogoPlacement ?? "above",
        stemHeight: 16,
      };
      const marker = new google.maps.Marker({
        position: center.mapCenter,
        map,
        title: center.name,
        optimized: false,
        // Hide the default pin until the logo icon is ready.
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 0,
        },
        zIndex: MAP_Z_INDEX.vacancyMarker + 10,
        clickable: interactive && !center.mapPinOnly,
      });

      iconWork.push(
        createShoppingCenterMarkerIcon(center.logo, {
          lightBox: center.lightLogoMarker,
          boxBg: center.logoMarkerBg,
          compact: true,
          placement: layout.placement,
          offsetX: 0,
          showStem: true,
          stemHeight: layout.stemHeight,
          showAnchorDot: false,
          stemHalo: false,
          logoWidth: center.masterMapLogoWidth,
          logoCrop: center.logoCrop,
        }).then((icon) => {
          if (!cancelled) marker.setIcon(icon);
        })
      );

      if (interactive && !center.mapPinOnly) {
        listeners.push(
          marker.addListener("click", () => {
            onCenterSelect(center);
          })
        );
      }
      markers.push(marker);
    }

    void Promise.all(iconWork).then(() => {
      if (!cancelled) onIconsResolved?.();
    });

    return () => {
      cancelled = true;
      for (const listener of listeners) listener.remove();
      for (const marker of markers) marker.setMap(null);
    };
  }, [
    map,
    corridors,
    centers,
    layouts,
    navigate,
    interactive,
    onCenterSelect,
    onIconsResolved,
  ]);

  return null;
}

function OverviewMapLayers({
  corridorLocations,
  shoppingCenters,
  interactive,
  onCenterSelect,
  onReady,
}: {
  corridorLocations: DashboardMapLocation[];
  shoppingCenters: ShoppingCenter[];
  interactive: boolean;
  onCenterSelect: (center: ShoppingCenter) => void;
  onReady?: () => void;
}) {
  const [iconsResolved, setIconsResolved] = useState(false);
  const [settled, setSettled] = useState(false);
  const [fitted, setFitted] = useState(false);
  const [heroReady, setHeroReady] = useState(false);

  const handleIconsResolved = useCallback(() => setIconsResolved(true), []);
  const handleSettled = useCallback(() => setSettled(true), []);
  const handleHeroReady = useCallback(() => setHeroReady(true), []);

  useEffect(() => {
    const fallback = window.setTimeout(() => setHeroReady(true), 3000);
    return () => window.clearTimeout(fallback);
  }, []);

  useEffect(() => {
    if (iconsResolved && settled && fitted && heroReady) onReady?.();
  }, [fitted, heroReady, iconsResolved, settled, onReady]);

  useEffect(() => {
    if (!onReady) return;
    const fallback = window.setTimeout(() => onReady(), 12_000);
    return () => window.clearTimeout(fallback);
  }, [onReady]);

  const handleFitted = useCallback(() => {
    setFitted(true);
  }, []);

  return (
    <>
      <FitDashboardBounds
        corridorLocations={corridorLocations}
        shoppingCenters={shoppingCenters}
        padding={FIT_BOUNDS_PADDING}
        tighten={false}
        onFitted={handleFitted}
      />
      <OverviewMarkers
        corridors={corridorLocations}
        centers={shoppingCenters}
        interactive={interactive}
        fitted={fitted}
        onCenterSelect={onCenterSelect}
        onIconsResolved={handleIconsResolved}
      />
      {onReady ? <MapSettled onSettled={handleSettled} /> : null}
      {interactive ? <StreetViewControl /> : null}
      <DashboardMapHeroOverlay
        locked={!interactive}
        onReady={handleHeroReady}
      />
      {interactive ? null : <HideMapImageryErrors />}
    </>
  );
}

interface DashboardOverviewMapProps {
  /** Booklet export: restrict to these high-street slugs. */
  corridorSlugs?: string[];
  /** Booklet export: restrict to these shopping-center slugs. */
  centerSlugs?: string[];
  /** Booklet export: false removes zoom/street view chrome and click targets. */
  interactive?: boolean;
  /** Fires once markers, logos and tiles have all settled. */
  onReady?: () => void;
  /**
   * Booklet cover: drop the cloud Map ID so JSON styles can keep city names
   * and highway shields. The live dashboard keeps the cloud style.
   */
  showBaseMapLabels?: boolean;
}

export function DashboardOverviewMap({
  corridorSlugs,
  centerSlugs,
  interactive = true,
  onReady,
  showBaseMapLabels = false,
}: DashboardOverviewMapProps = {}) {
  const navigate = useNavigate();
  const mapId = showBaseMapLabels ? undefined : getMasterMapId();
  const corridorFilterKey = corridorSlugs?.join(",") ?? null;
  const centerFilterKey = centerSlugs?.join(",") ?? null;

  const corridorLocations = useMemo(() => {
    const locations = getActiveDashboardMapLocations().filter(
      (location) => location.category === "high-streets"
    );
    if (corridorFilterKey === null) return locations;
    const allowed = new Set(corridorFilterKey.split(",").filter(Boolean));
    return locations.filter((location) => allowed.has(location.slug));
  }, [corridorFilterKey]);

  const shoppingCenters = useMemo(() => {
    const centers = getActiveShoppingCenters().filter(
      (center) => !center.mapPinOnly
    );
    if (centerFilterKey === null) return centers;
    const allowed = new Set(centerFilterKey.split(",").filter(Boolean));
    return centers.filter((center) => allowed.has(center.slug));
  }, [centerFilterKey]);

  const handleShoppingCenterSelect = useCallback(
    (center: ShoppingCenter) => {
      if (center.mapPinOnly) return;
      navigate(`/center/${center.slug}`);
    },
    [navigate]
  );

  return (
    <div className="dashboard-overview-map" aria-label="High streets overview map">
      <Map
        className="dashboard-overview-map__canvas"
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        {...(mapId
          ? { mapId }
          : { styles: MAP_STYLES_DASHBOARD_BASE_LABELS })}
        mapTypeId="roadmap"
        gestureHandling={interactive ? "greedy" : "none"}
        disableDefaultUI
        zoomControl={interactive}
        streetViewControl={false}
        clickableIcons={false}
      >
        <OverviewMapLayers
          corridorLocations={corridorLocations}
          shoppingCenters={shoppingCenters}
          interactive={interactive}
          onCenterSelect={handleShoppingCenterSelect}
          onReady={onReady}
        />
      </Map>
    </div>
  );
}
