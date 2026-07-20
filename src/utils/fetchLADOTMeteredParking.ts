import type {
  LADOTParkingFeatureCollection,
  LADOTParkingPointFeature,
  LADOTParkingProperties,
} from "../types/ladotParking";

const LADOT_API_URL =
  "https://data.lacity.org/resource/s49e-q6j2.json?$limit=50000";

interface LADOTApiLatLng {
  latitude?: string;
  longitude?: string;
}

interface LADOTApiLocation {
  latitude?: string;
  longitude?: string;
  coordinates?: [number, number];
}

interface LADOTApiRecord {
  spaceid?: string;
  blockface?: string;
  metertype?: string;
  ratetype?: string;
  raterange?: string;
  timelimit?: string;
  latlng?: LADOTApiLatLng;
  location?: LADOTApiLocation | string;
}

let cachedCollection: LADOTParkingFeatureCollection | null = null;
let fetchPromise: Promise<LADOTParkingFeatureCollection> | null = null;

function parseCoordinate(value: unknown): number | null {
  if (value == null || value === "") return null;
  const num = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(num) ? num : null;
}

function parseCoordinates(record: LADOTApiRecord): [number, number] | null {
  const latlng = record.latlng;
  if (latlng) {
    const lat = parseCoordinate(latlng.latitude);
    const lng = parseCoordinate(latlng.longitude);
    if (lat != null && lng != null) return [lng, lat];
  }

  const location = record.location;
  if (location && typeof location === "object") {
    const lat = parseCoordinate(location.latitude);
    const lng = parseCoordinate(location.longitude);
    if (lat != null && lng != null) return [lng, lat];

    if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
      const lngCoord = parseCoordinate(location.coordinates[0]);
      const latCoord = parseCoordinate(location.coordinates[1]);
      if (latCoord != null && lngCoord != null) return [lngCoord, latCoord];
    }
  }

  return null;
}

function toProperties(record: LADOTApiRecord): LADOTParkingProperties | null {
  const spaceId = record.spaceid?.trim();
  if (!spaceId) return null;

  return {
    spaceId,
    blockface: record.blockface?.trim() ?? "",
    meterType: record.metertype?.trim() ?? "",
    rateType: record.ratetype?.trim() ?? "",
    rateRange: record.raterange?.trim() ?? "",
    timeLimit: record.timelimit?.trim() ?? "",
  };
}

function recordsToGeoJSON(records: LADOTApiRecord[]): LADOTParkingFeatureCollection {
  const features: LADOTParkingPointFeature[] = [];

  for (const record of records) {
    const coordinates = parseCoordinates(record);
    const properties = toProperties(record);
    if (!coordinates || !properties) continue;

    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates },
      properties,
    });
  }

  return { type: "FeatureCollection", features };
}

/** Fetch LADOT metered parking inventory and return valid GeoJSON Point features. */
export async function fetchLADOTMeteredParking(): Promise<LADOTParkingFeatureCollection> {
  if (cachedCollection) return cachedCollection;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    const response = await fetch(LADOT_API_URL);
    if (!response.ok) {
      throw new Error(
        `LADOT parking API failed (${response.status} ${response.statusText})`
      );
    }

    const records = (await response.json()) as LADOTApiRecord[];
    if (!Array.isArray(records)) {
      throw new Error("LADOT parking API returned unexpected payload");
    }

    cachedCollection = recordsToGeoJSON(records);
    return cachedCollection;
  })();

  try {
    return await fetchPromise;
  } catch (error) {
    fetchPromise = null;
    throw error;
  }
}

/** Clear in-memory cache (useful for tests or manual refresh). */
export function clearLADOTMeteredParkingCache(): void {
  cachedCollection = null;
  fetchPromise = null;
}
