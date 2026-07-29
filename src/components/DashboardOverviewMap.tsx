import { Map, useMap } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MAP_Z_INDEX } from "../config/mapZIndex";
import {
  HIGH_STREET_CORRIDORS,
  type HighStreetCorridor,
} from "../data/highStreets";
import {
  getShoppingCenter,
  type ShoppingCenter,
} from "../data/shoppingCenters";
import { createCalloutIcon } from "../utils/createCalloutIcon";
import {
  getActiveDashboardMapLocations,
  type DashboardMapLocation,
} from "../utils/dashboardMapLocations";
import { getMasterMapId } from "../utils/mapConfig";
import { ShoppingCenterPinsLayer } from "./ShoppingCenterPinsLayer";

const DEFAULT_CENTER = { lat: 34.05, lng: -118.42 };
const DEFAULT_ZOOM = 10;
/** Room for compact pills / logos above/below pins without clipping the map frame. */
const FIT_BOUNDS_PADDING = {
  top: 56,
  right: 48,
  bottom: 56,
  left: 48,
};

function FitDashboardBounds({
  corridorLocations,
  shoppingCenters,
}: {
  corridorLocations: DashboardMapLocation[];
  shoppingCenters: ShoppingCenter[];
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
    map.fitBounds(bounds, FIT_BOUNDS_PADDING);
  }, [map, corridorLocations, shoppingCenters]);

  return null;
}

function CorridorOverviewMarkers({
  locations,
}: {
  locations: DashboardMapLocation[];
}) {
  const map = useMap();
  const navigate = useNavigate();

  useEffect(() => {
    if (!map || locations.length === 0) return;

    const markers: google.maps.Marker[] = [];
    const listeners: google.maps.MapsEventListener[] = [];

    for (const location of locations) {
      const marker = new google.maps.Marker({
        position: location.position,
        map,
        icon: createCalloutIcon(location.label, {
          size: "compact",
          showStem: false,
          showAnchorDot: true,
          placement: location.labelPlacement ?? "above",
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

    return () => {
      for (const listener of listeners) listener.remove();
      for (const marker of markers) marker.setMap(null);
    };
  }, [map, locations, navigate]);

  return null;
}

function getActiveShoppingCenters(): ShoppingCenter[] {
  return HIGH_STREET_CORRIDORS.filter(
    (corridor: HighStreetCorridor) =>
      corridor.active && corridor.category === "shopping-centers"
  )
    .map((corridor) => getShoppingCenter(corridor.slug))
    .filter((center): center is ShoppingCenter => Boolean(center));
}

export function DashboardOverviewMap() {
  const navigate = useNavigate();
  const mapId = getMasterMapId();

  const corridorLocations = useMemo(
    () =>
      getActiveDashboardMapLocations().filter(
        (location) =>
          location.category === "high-streets" ||
          location.category === "shopping-districts"
      ),
    []
  );

  const shoppingCenters = useMemo(() => getActiveShoppingCenters(), []);

  const handleShoppingCenterSelect = useCallback(
    (center: ShoppingCenter) => {
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
        clickableIcons={false}
      >
        <FitDashboardBounds
          corridorLocations={corridorLocations}
          shoppingCenters={shoppingCenters}
        />
        <CorridorOverviewMarkers locations={corridorLocations} />
        <ShoppingCenterPinsLayer
          centers={shoppingCenters}
          onSelect={handleShoppingCenterSelect}
        />
      </Map>
    </div>
  );
}
