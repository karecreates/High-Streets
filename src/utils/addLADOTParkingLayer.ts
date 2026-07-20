import type {
  LADOTParkingFeatureCollection,
  LADOTParkingPointFeature,
  LADOTParkingProperties,
} from "../types/ladotParking";
import { LADOT_METERED_PARKING_SOURCE } from "../types/ladotParking";
import { MAP_Z_INDEX } from "../config/mapZIndex";
import { createParkingMarkerIcon } from "./createParkingMarkerIcon";

export const LADOT_PARKING_MIN_ZOOM = 16;
export const LADOT_PARKING_MAX_VISIBLE = 2500;
const PARKING_MARKER_Z_INDEX = MAP_Z_INDEX.parkingMarker;

export interface LADOTParkingLayerOptions {
  minZoom?: number;
  maxVisible?: number;
  onSelect?: (
    properties: LADOTParkingProperties,
    position: google.maps.LatLngLiteral
  ) => void;
  onHover?: (
    properties: LADOTParkingProperties,
    position: google.maps.LatLngLiteral
  ) => void;
  onHoverEnd?: () => void;
}

interface IndexedParkingFeature {
  feature: LADOTParkingPointFeature;
  lat: number;
  lng: number;
}

function distanceSquared(
  latA: number,
  lngA: number,
  latB: number,
  lngB: number
): number {
  const dLat = latA - latB;
  const dLng = lngA - lngB;
  return dLat * dLat + dLng * dLng;
}

function featuresInBounds(
  features: IndexedParkingFeature[],
  bounds: google.maps.LatLngBounds,
  center: google.maps.LatLng,
  maxVisible: number
): IndexedParkingFeature[] {
  const centerLat = center.lat();
  const centerLng = center.lng();
  const visible: IndexedParkingFeature[] = [];

  for (const item of features) {
    if (!bounds.contains({ lat: item.lat, lng: item.lng })) continue;
    visible.push(item);
  }

  if (visible.length <= maxVisible) return visible;

  visible.sort(
    (a, b) =>
      distanceSquared(a.lat, a.lng, centerLat, centerLng) -
      distanceSquared(b.lat, b.lng, centerLat, centerLng)
  );
  return visible.slice(0, maxVisible);
}

function parkingMarkerTitle(properties: LADOTParkingProperties): string {
  const parts = [
    properties.blockface,
    properties.rateRange,
    properties.timeLimit,
  ].filter(Boolean);
  return parts.join(" · ") || "Metered parking";
}

/**
 * Add LADOT metered parking markers to a Google Map.
 * Markers are viewport-culled and only shown at zoom {minZoom}+.
 */
export function addLADOTParkingLayer(
  map: google.maps.Map,
  featureCollection: LADOTParkingFeatureCollection,
  options: LADOTParkingLayerOptions = {}
): () => void {
  const minZoom = options.minZoom ?? LADOT_PARKING_MIN_ZOOM;
  const maxVisible = options.maxVisible ?? LADOT_PARKING_MAX_VISIBLE;

  const indexedFeatures: IndexedParkingFeature[] = featureCollection.features.map(
    (feature) => ({
      feature,
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
    })
  );

  const visibleMarkers = new Map<string, google.maps.Marker>();
  const markerListeners = new Map<string, google.maps.MapsEventListener[]>();
  const mapListeners: google.maps.MapsEventListener[] = [];
  let icon: google.maps.Icon | null = null;
  let updateTimer: ReturnType<typeof setTimeout> | null = null;
  let cancelled = false;

  const removeMarker = (spaceId: string) => {
    const marker = visibleMarkers.get(spaceId);
    if (!marker) return;
    markerListeners.get(spaceId)?.forEach((listener) => listener.remove());
    markerListeners.delete(spaceId);
    marker.setMap(null);
    visibleMarkers.delete(spaceId);
  };

  const clearMarkers = () => {
    for (const spaceId of [...visibleMarkers.keys()]) {
      removeMarker(spaceId);
    }
  };

  const updateVisibleMarkers = () => {
    if (cancelled) return;

    const zoom = map.getZoom() ?? 0;
    if (zoom < minZoom) {
      clearMarkers();
      return;
    }

    const bounds = map.getBounds();
    if (!bounds) return;

    const center = bounds.getCenter();
    const nextVisible = featuresInBounds(
      indexedFeatures,
      bounds,
      center,
      maxVisible
    );
    const nextIds = new Set<string>();

    for (const item of nextVisible) {
      const { feature, lat, lng } = item;
      const spaceId = feature.properties.spaceId;
      nextIds.add(spaceId);

      if (visibleMarkers.has(spaceId)) continue;
      if (!icon) continue;

      const position = { lat, lng };
      const marker = new google.maps.Marker({
        position,
        map,
        icon,
        title: parkingMarkerTitle(feature.properties),
        optimized: false,
        zIndex: PARKING_MARKER_Z_INDEX,
      });

      const itemListeners: google.maps.MapsEventListener[] = [
        marker.addListener("click", () => {
          options.onSelect?.(feature.properties, position);
        }),
      ];

      if (options.onHover) {
        itemListeners.push(
          marker.addListener("mouseover", () => {
            options.onHover?.(feature.properties, position);
          })
        );
      }

      if (options.onHoverEnd) {
        itemListeners.push(
          marker.addListener("mouseout", () => {
            options.onHoverEnd?.();
          })
        );
      }

      markerListeners.set(spaceId, itemListeners);
      visibleMarkers.set(spaceId, marker);
    }

    for (const spaceId of [...visibleMarkers.keys()]) {
      if (nextIds.has(spaceId)) continue;
      removeMarker(spaceId);
    }
  };

  const scheduleUpdate = () => {
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = setTimeout(updateVisibleMarkers, 80);
  };

  createParkingMarkerIcon()
    .then((loadedIcon) => {
      if (cancelled) return;
      icon = loadedIcon;
      updateVisibleMarkers();
    })
    .catch((error) => {
      console.warn(`[${LADOT_METERED_PARKING_SOURCE}] icon load failed`, error);
    });

  mapListeners.push(map.addListener("idle", scheduleUpdate));
  mapListeners.push(map.addListener("zoom_changed", scheduleUpdate));

  const mapWithMeta = map as google.maps.Map & {
    __ladotParkingLayers?: Set<string>;
  };
  if (!mapWithMeta.__ladotParkingLayers) {
    mapWithMeta.__ladotParkingLayers = new Set();
  }
  mapWithMeta.__ladotParkingLayers.add(LADOT_METERED_PARKING_SOURCE);

  return () => {
    cancelled = true;
    if (updateTimer) clearTimeout(updateTimer);
    mapListeners.forEach((listener) => listener.remove());
    clearMarkers();
    mapWithMeta.__ladotParkingLayers?.delete(LADOT_METERED_PARKING_SOURCE);
  };
}
