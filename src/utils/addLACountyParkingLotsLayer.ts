import type {
  LACountyBounds,
  LACountyParkingLotProperties,
} from "../types/lacountyParkingLots";
import { LACOUNTY_PARKING_LOTS_SOURCE } from "../types/lacountyParkingLots";
import { MAP_Z_INDEX } from "../config/mapZIndex";
import {
  boundsFromGoogleBounds,
  fetchLACountyParkingLots,
  getCachedLotsInBounds,
} from "./fetchLACountyParkingLots";

export const LACOUNTY_LOTS_FILL_MIN_ZOOM = 14;

const FILL_COLOR = "#1A73E8";
const FILL_OPACITY = 0.25;
const STROKE_WEIGHT = 1.5;
const LOT_POLYGON_Z_INDEX = MAP_Z_INDEX.parkingLotFill;

export interface LACountyParkingLotsLayerOptions {
  fillMinZoom?: number;
  onSelect?: (
    properties: LACountyParkingLotProperties,
    position: google.maps.LatLngLiteral
  ) => void;
}

function lotPropertiesFromDataFeature(
  feature: google.maps.Data.Feature
): LACountyParkingLotProperties {
  return {
    fid: Number(feature.getProperty("fid") ?? 0),
    ain: String(feature.getProperty("ain") ?? ""),
    useType: String(feature.getProperty("useType") ?? ""),
    useDescription: String(feature.getProperty("useDescription") ?? ""),
    areaSqFt: parseNullableNumber(feature.getProperty("areaSqFt")),
    areaSqM: parseNullableNumber(feature.getProperty("areaSqM")),
  };
}

function parseNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function positionFromDataFeature(
  feature: google.maps.Data.Feature
): google.maps.LatLngLiteral | null {
  const geometry = feature.getGeometry();
  if (!geometry) return null;

  const bounds = new google.maps.LatLngBounds();
  geometry.forEachLatLng((latLng) => bounds.extend(latLng));
  const center = bounds.getCenter();
  return { lat: center.lat(), lng: center.lng() };
}

function boundsKey(bounds: LACountyBounds): string {
  const round = (value: number) => value.toFixed(3);
  return [
    round(bounds.west),
    round(bounds.south),
    round(bounds.east),
    round(bounds.north),
  ].join("|");
}

function updatePolygonStyle(
  dataLayer: google.maps.Data,
  zoom: number,
  fillMinZoom: number
) {
  const visible = zoom >= fillMinZoom;
  dataLayer.setStyle({
    visible,
    fillColor: FILL_COLOR,
    fillOpacity: visible ? FILL_OPACITY : 0,
    strokeColor: FILL_COLOR,
    strokeOpacity: visible ? 1 : 0,
    strokeWeight: STROKE_WEIGHT,
    clickable: visible,
    zIndex: LOT_POLYGON_Z_INDEX,
  });
}

function refreshPolygons(dataLayer: google.maps.Data, bounds: LACountyBounds) {
  dataLayer.forEach((feature) => dataLayer.remove(feature));
  const collection = getCachedLotsInBounds(bounds);
  if (!collection.features.length) return;

  dataLayer.addGeoJson({
    type: "FeatureCollection",
    features: collection.features.map((feature) => ({
      type: "Feature",
      geometry: feature.geometry,
      properties: {
        fid: feature.properties.fid,
        ain: feature.properties.ain,
        useType: feature.properties.useType,
        useDescription: feature.properties.useDescription,
        areaSqFt: feature.properties.areaSqFt,
        areaSqM: feature.properties.areaSqM,
      },
    })),
  });
}

/**
 * Add LA County parking lot polygon shading to a Google Map.
 * Uses bounds-based fetching with debounced updates.
 */
export function addLACountyParkingLotsLayer(
  map: google.maps.Map,
  options: LACountyParkingLotsLayerOptions = {}
): () => void {
  const fillMinZoom = options.fillMinZoom ?? LACOUNTY_LOTS_FILL_MIN_ZOOM;

  const polygonLayer = new google.maps.Data();
  polygonLayer.setMap(map);

  const mapListeners: google.maps.MapsEventListener[] = [];
  let updateTimer: ReturnType<typeof setTimeout> | null = null;
  let fetchToken = 0;
  let cancelled = false;
  let lastBoundsKey = "";

  const syncLayers = () => {
    if (cancelled) return;

    const zoom = map.getZoom() ?? 0;
    const googleBounds = map.getBounds();
    if (!googleBounds) return;

    const bounds = boundsFromGoogleBounds(googleBounds);
    updatePolygonStyle(polygonLayer, zoom, fillMinZoom);

    if (zoom < fillMinZoom) {
      polygonLayer.forEach((feature) => polygonLayer.remove(feature));
      return;
    }

    refreshPolygons(polygonLayer, bounds);
  };

  const scheduleUpdate = () => {
    if (updateTimer) clearTimeout(updateTimer);
    updateTimer = setTimeout(async () => {
      if (cancelled) return;

      const zoom = map.getZoom() ?? 0;
      if (zoom < fillMinZoom) {
        lastBoundsKey = "";
        syncLayers();
        return;
      }

      const googleBounds = map.getBounds();
      if (!googleBounds) return;

      const bounds = boundsFromGoogleBounds(googleBounds);
      const key = boundsKey(bounds);

      if (key !== lastBoundsKey) {
        const token = ++fetchToken;
        try {
          await fetchLACountyParkingLots(bounds);
          if (cancelled || token !== fetchToken) return;
          lastBoundsKey = key;
        } catch (error) {
          console.warn(`[${LACOUNTY_PARKING_LOTS_SOURCE}] fetch failed`, error);
        }
      }

      syncLayers();
    }, 250);
  };

  mapListeners.push(
    polygonLayer.addListener("click", (event: google.maps.Data.MouseEvent) => {
      const feature = event.feature;
      if (!feature) return;
      const position =
        positionFromDataFeature(feature) ??
        (event.latLng
          ? { lat: event.latLng.lat(), lng: event.latLng.lng() }
          : null);
      if (!position) return;
      options.onSelect?.(lotPropertiesFromDataFeature(feature), position);
    })
  );

  mapListeners.push(map.addListener("idle", scheduleUpdate));
  mapListeners.push(map.addListener("zoom_changed", scheduleUpdate));
  scheduleUpdate();

  const mapWithMeta = map as google.maps.Map & {
    __lacountyParkingLayers?: Set<string>;
  };
  if (!mapWithMeta.__lacountyParkingLayers) {
    mapWithMeta.__lacountyParkingLayers = new Set();
  }
  mapWithMeta.__lacountyParkingLayers.add(LACOUNTY_PARKING_LOTS_SOURCE);

  return () => {
    cancelled = true;
    if (updateTimer) clearTimeout(updateTimer);
    mapListeners.forEach((listener) => listener.remove());
    polygonLayer.setMap(null);
    mapWithMeta.__lacountyParkingLayers?.delete(LACOUNTY_PARKING_LOTS_SOURCE);
  };
}
