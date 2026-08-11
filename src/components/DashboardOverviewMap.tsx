import { Map, useMap } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MAP_Z_INDEX } from "../config/mapZIndex";
import type { ShoppingCenter } from "../data/shoppingCenters";
import { useOverviewMarkerLayouts } from "../hooks/useOverviewMarkerLayouts";
import { createCalloutIcon } from "../utils/createCalloutIcon";
import { createShoppingCenterMarkerIcon } from "../utils/createShoppingCenterMarkerIcon";
import {
  getActiveDashboardMapLocations,
  type DashboardMapLocation,
} from "../utils/dashboardMapLocations";
import { getActiveShoppingCenters } from "../utils/mapContextOverlays";
import { getMasterMapId } from "../utils/mapConfig";
import type { OverviewMarkerLayout } from "../utils/overviewMarkerLayout";
import { StreetViewControl } from "./StreetViewControl";

const DEFAULT_CENTER = { lat: 34.05, lng: -118.42 };
const DEFAULT_ZOOM = 10;
/** Room for compact pills / logos above/below pins without clipping the map frame. */
const FIT_BOUNDS_PADDING = {
  top: 64,
  right: 56,
  bottom: 64,
  left: 56,
};

function FitDashboardBounds({
  corridorLocations,
  shoppingCenters,
  onFitted,
}: {
  corridorLocations: DashboardMapLocation[];
  shoppingCenters: ShoppingCenter[];
  onFitted: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const positions = [
      ...corridorLocations.map((location) => location.position),
      ...shoppingCenters.map((center) => center.mapCenter),
    ];
    if (positions.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    for (const position of positions) {
      bounds.extend(position);
    }

    const idleListener = map.addListener("idle", () => {
      idleListener.remove();
      onFitted();
    });
    map.fitBounds(bounds, FIT_BOUNDS_PADDING);

    return () => {
      idleListener.remove();
    };
  }, [map, corridorLocations, shoppingCenters, onFitted]);

  return null;
}

function OverviewMarkers({
  corridors,
  centers,
  layouts,
  onCenterSelect,
}: {
  corridors: DashboardMapLocation[];
  centers: ShoppingCenter[];
  layouts: Record<string, OverviewMarkerLayout>;
  onCenterSelect: (center: ShoppingCenter) => void;
}) {
  const map = useMap();
  const navigate = useNavigate();

  useEffect(() => {
    if (!map) return;

    const markers: google.maps.Marker[] = [];
    const listeners: google.maps.MapsEventListener[] = [];
    let cancelled = false;

    for (const location of corridors) {
      const layout = layouts[`corridor:${location.slug}`] ?? {
        placement: location.labelPlacement ?? "above",
        offsetX: 0,
      };
      const marker = new google.maps.Marker({
        position: location.position,
        map,
        icon: createCalloutIcon(location.label, {
          size: "compact",
          showStem: false,
          showAnchorDot: true,
          placement: layout.placement,
          offsetX: layout.offsetX,
        }),
        optimized: false,
        zIndex: MAP_Z_INDEX.tenantMarker,
        title: location.name,
        clickable: true,
      });
      listeners.push(
        marker.addListener("click", () => {
          navigate(location.detailPath);
        })
      );
      markers.push(marker);
    }

    for (const center of centers) {
      const layout = layouts[`center:${center.slug}`] ?? {
        placement: center.masterMapLogoPlacement ?? "above",
        offsetX: 0,
      };
      const marker = new google.maps.Marker({
        position: center.mapCenter,
        map,
        title: center.name,
        optimized: false,
        zIndex: MAP_Z_INDEX.vacancyMarker + 10,
        clickable: !center.mapPinOnly,
      });

      createShoppingCenterMarkerIcon(center.logo, {
        lightBox: center.lightLogoMarker,
        boxBg: center.logoMarkerBg,
        compact: true,
        placement: layout.placement,
        offsetX: layout.offsetX,
        logoWidth: center.masterMapLogoWidth,
        logoCrop: center.logoCrop,
      }).then((icon) => {
        if (!cancelled) marker.setIcon(icon);
      });

      if (!center.mapPinOnly) {
        listeners.push(
          marker.addListener("click", () => {
            onCenterSelect(center);
          })
        );
      }
      markers.push(marker);
    }

    return () => {
      cancelled = true;
      for (const listener of listeners) listener.remove();
      for (const marker of markers) marker.setMap(null);
    };
  }, [map, corridors, centers, layouts, navigate, onCenterSelect]);

  return null;
}

function OverviewMapLayers({
  corridorLocations,
  shoppingCenters,
  onCenterSelect,
}: {
  corridorLocations: DashboardMapLocation[];
  shoppingCenters: ShoppingCenter[];
  onCenterSelect: (center: ShoppingCenter) => void;
}) {
  const { layouts, markFitted } = useOverviewMarkerLayouts(
    corridorLocations,
    shoppingCenters,
    { deferUntilReady: true }
  );

  return (
    <>
      <FitDashboardBounds
        corridorLocations={corridorLocations}
        shoppingCenters={shoppingCenters}
        onFitted={markFitted}
      />
      <OverviewMarkers
        corridors={corridorLocations}
        centers={shoppingCenters}
        layouts={layouts}
        onCenterSelect={onCenterSelect}
      />
      <StreetViewControl />
    </>
  );
}

export function DashboardOverviewMap() {
  const navigate = useNavigate();
  const mapId = getMasterMapId();

  const corridorLocations = useMemo(
    () =>
      getActiveDashboardMapLocations().filter(
        (location) => location.category === "high-streets"
      ),
    []
  );

  const shoppingCenters = useMemo(
    () => getActiveShoppingCenters().filter((center) => !center.mapPinOnly),
    []
  );

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
        mapId={mapId}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        streetViewControl={false}
        clickableIcons={false}
      >
        <OverviewMapLayers
          corridorLocations={corridorLocations}
          shoppingCenters={shoppingCenters}
          onCenterSelect={handleShoppingCenterSelect}
        />
      </Map>
    </div>
  );
}
