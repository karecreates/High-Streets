import type {
  LACountyBounds,
  LACountyParkingLotCentroidFeature,
  LACountyParkingLotCentroidsCollection,
  LACountyParkingLotPolygonFeature,
  LACountyParkingLotProperties,
  LACountyParkingLotsCollection,
} from "../types/lacountyParkingLots";
import { polygonCentroid } from "./polygonCentroid";

const FEATURE_SERVER_URL =
  "https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Parking_Lots_(2014)_from_LARIAC/FeatureServer/0/query";

const PAGE_SIZE = 2000;
const SQFT_PER_SQM = 10.763910416709722;

interface ArcGISLotAttributes {
  FID?: number;
  AIN?: string;
  UseType?: string;
  UseDescrip?: string;
  Shape_STAr?: number;
  Shape__Area?: number;
}

interface ArcGISLotFeature {
  type: "Feature";
  id?: number;
  geometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon | null;
  properties?: ArcGISLotAttributes & Record<string, unknown>;
}

interface ArcGISFeatureCollection {
  type: "FeatureCollection";
  features: ArcGISLotFeature[];
  properties?: {
    exceededTransferLimit?: boolean;
  };
}

const lotCache = new Map<number, LACountyParkingLotPolygonFeature>();

function parseNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const num = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(num) ? num : null;
}

function toLotProperties(
  attributes: ArcGISLotAttributes,
  fallbackId?: number
): LACountyParkingLotProperties | null {
  const fid = parseNumber(attributes.FID) ?? fallbackId;
  if (fid == null) return null;

  const areaSqM = parseNumber(attributes.Shape__Area);
  const shapeStar = parseNumber(attributes.Shape_STAr);
  const areaSqFt =
    shapeStar != null && shapeStar > 0
      ? shapeStar
      : areaSqM != null
        ? areaSqM * SQFT_PER_SQM
        : null;

  return {
    fid,
    ain: attributes.AIN?.trim() ?? "",
    useType: attributes.UseType?.trim() ?? "",
    useDescription: attributes.UseDescrip?.trim() ?? "",
    areaSqFt,
    areaSqM,
  };
}

function normalizeFeature(
  feature: ArcGISLotFeature
): LACountyParkingLotPolygonFeature | null {
  if (!feature.geometry) return null;
  if (
    feature.geometry.type !== "Polygon" &&
    feature.geometry.type !== "MultiPolygon"
  ) {
    return null;
  }

  const properties = toLotProperties(
    feature.properties ?? {},
    typeof feature.id === "number" ? feature.id : undefined
  );
  if (!properties) return null;

  return {
    type: "Feature",
    geometry: feature.geometry,
    properties,
  };
}

function expandBounds(bounds: LACountyBounds, factor = 0.2): LACountyBounds {
  const latSpan = bounds.north - bounds.south;
  const lngSpan = bounds.east - bounds.west;
  return {
    north: bounds.north + latSpan * factor,
    south: bounds.south - latSpan * factor,
    east: bounds.east + lngSpan * factor,
    west: bounds.west - lngSpan * factor,
  };
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

const fetchedBoundsKeys = new Set<string>();

async function fetchPage(
  bounds: LACountyBounds,
  offset: number
): Promise<ArcGISFeatureCollection> {
  const params = new URLSearchParams({
    where: "1=1",
    outFields: "*",
    returnGeometry: "true",
    f: "geojson",
    outSR: "4326",
    inSR: "4326",
    geometryType: "esriGeometryEnvelope",
    spatialRel: "esriSpatialRelIntersects",
    resultRecordCount: String(PAGE_SIZE),
    resultOffset: String(offset),
    geometry: JSON.stringify({
      xmin: bounds.west,
      ymin: bounds.south,
      xmax: bounds.east,
      ymax: bounds.north,
      spatialReference: { wkid: 4326 },
    }),
  });

  const response = await fetch(`${FEATURE_SERVER_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(
      `LA County parking lots API failed (${response.status} ${response.statusText})`
    );
  }

  const payload = (await response.json()) as ArcGISFeatureCollection;
  if (!payload?.features || !Array.isArray(payload.features)) {
    throw new Error("LA County parking lots API returned unexpected payload");
  }

  return payload;
}

/** Fetch parking lot polygons for a map bounds envelope (paginated). */
export async function fetchLACountyParkingLotsForBounds(
  bounds: LACountyBounds
): Promise<LACountyParkingLotsCollection> {
  const expanded = expandBounds(bounds);
  const key = boundsKey(expanded);
  if (fetchedBoundsKeys.has(key)) {
    return getCachedLotsInBounds(bounds);
  }

  const collected: LACountyParkingLotPolygonFeature[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const page = await fetchPage(expanded, offset);
    for (const feature of page.features) {
      const normalized = normalizeFeature(feature);
      if (!normalized) continue;
      lotCache.set(normalized.properties.fid, normalized);
      collected.push(normalized);
    }

    hasMore = Boolean(page.properties?.exceededTransferLimit);
    offset += PAGE_SIZE;
    if (!page.features.length) break;
  }

  fetchedBoundsKeys.add(key);
  return {
    type: "FeatureCollection",
    features: collected.length ? collected : getCachedLotsInBounds(bounds).features,
  };
}

/** Return cached parking lots intersecting the given bounds. */
export function getCachedLotsInBounds(
  bounds: LACountyBounds
): LACountyParkingLotsCollection {
  const features = [...lotCache.values()].filter((feature) =>
    lotIntersectsBounds(feature, bounds)
  );
  return { type: "FeatureCollection", features };
}

function lotIntersectsBounds(
  feature: LACountyParkingLotPolygonFeature,
  bounds: LACountyBounds
): boolean {
  const rings =
    feature.geometry.type === "Polygon"
      ? [feature.geometry.coordinates[0]]
      : feature.geometry.coordinates.map((polygon) => polygon[0]);

  for (const ring of rings) {
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;

    for (const [lng, lat] of ring) {
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    }

    const intersects =
      maxLng >= bounds.west &&
      minLng <= bounds.east &&
      maxLat >= bounds.south &&
      minLat <= bounds.north;

    if (intersects) return true;
  }

  return false;
}

/** Build centroid point features for parking lot label/icon placement. */
export function buildParkingLotCentroids(
  collection: LACountyParkingLotsCollection
): LACountyParkingLotCentroidsCollection {
  const features: LACountyParkingLotCentroidFeature[] = collection.features.map(
    (feature) => {
      const [lng, lat] = polygonCentroid(feature.geometry);
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [lng, lat] },
        properties: feature.properties,
      };
    }
  );

  return { type: "FeatureCollection", features };
}

/**
 * Fetch LA County parking lots for the current viewport.
 * Results are cached in memory by expanded bounds and by feature id.
 */
export async function fetchLACountyParkingLots(
  bounds: LACountyBounds
): Promise<{
  polygons: LACountyParkingLotsCollection;
  centroids: LACountyParkingLotCentroidsCollection;
}> {
  await fetchLACountyParkingLotsForBounds(bounds);
  const polygons = getCachedLotsInBounds(bounds);
  return {
    polygons,
    centroids: buildParkingLotCentroids(polygons),
  };
}

export function clearLACountyParkingLotsCache(): void {
  lotCache.clear();
  fetchedBoundsKeys.clear();
}

export function boundsFromGoogleBounds(
  bounds: google.maps.LatLngBounds
): LACountyBounds {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  return {
    west: sw.lng(),
    south: sw.lat(),
    east: ne.lng(),
    north: ne.lat(),
  };
}
