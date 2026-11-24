/**
 * Orientation landmarks for Placer trade-area maps only.
 * Not used on street maps, master map, or dashboard overview.
 */
export interface TradeAreaLandmark {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  placement?: "above" | "below";
}

/** Major West LA landmarks for trade-area context at zoomed-out scale. */
export const TRADE_AREA_LANDMARKS: TradeAreaLandmark[] = [
  {
    id: "santa-monica-pier",
    name: "Santa Monica Pier",
    position: { lat: 34.0104, lng: -118.4962 },
    placement: "below",
  },
  {
    id: "venice-beach",
    name: "Venice Beach",
    position: { lat: 33.985, lng: -118.4695 },
    placement: "below",
  },
  {
    id: "marina-del-rey",
    name: "Marina del Rey",
    position: { lat: 33.9802, lng: -118.4517 },
    placement: "below",
  },
  {
    id: "getty-center",
    name: "Getty Center",
    position: { lat: 34.078, lng: -118.4741 },
    placement: "above",
  },
  {
    id: "ucla",
    name: "UCLA",
    position: { lat: 34.0689, lng: -118.4452 },
    placement: "above",
  },
  {
    id: "century-city",
    name: "Century City",
    position: { lat: 34.0589, lng: -118.417 },
    placement: "above",
  },
  {
    id: "beverly-hills",
    name: "Beverly Hills",
    position: { lat: 34.0696, lng: -118.4004 },
    placement: "above",
  },
  {
    id: "culver-city",
    name: "Culver City",
    position: { lat: 34.0211, lng: -118.3965 },
    placement: "below",
  },
  {
    id: "lax",
    name: "LAX",
    position: { lat: 33.9416, lng: -118.4085 },
    placement: "below",
  },
  {
    id: "sofi-stadium",
    name: "SoFi Stadium",
    position: { lat: 33.9535, lng: -118.3392 },
    placement: "below",
  },
  {
    id: "farmers-market",
    name: "Farmers Market",
    position: { lat: 34.0722, lng: -118.3606 },
    placement: "above",
  },
  {
    id: "lacma",
    name: "LACMA",
    position: { lat: 34.0639, lng: -118.3591 },
    placement: "below",
  },
  {
    id: "hollywood",
    name: "Hollywood",
    position: { lat: 34.1016, lng: -118.3267 },
    placement: "above",
  },
];

/** Degrees of padding around trade-area bounds when filtering landmarks. */
const BOUNDS_PAD_DEG = 0.04;

/**
 * Landmarks that fall inside (or just outside) the trade-area extent.
 * Keeps corridor trade-area maps relevant without cluttering far-away POIs.
 */
export function getLandmarksForTradeArea(
  polygons: Array<{ outer: Array<{ lat: number; lng: number }> }>
): TradeAreaLandmark[] {
  if (polygons.length === 0) return [];

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const polygon of polygons) {
    for (const point of polygon.outer) {
      minLat = Math.min(minLat, point.lat);
      maxLat = Math.max(maxLat, point.lat);
      minLng = Math.min(minLng, point.lng);
      maxLng = Math.max(maxLng, point.lng);
    }
  }

  minLat -= BOUNDS_PAD_DEG;
  maxLat += BOUNDS_PAD_DEG;
  minLng -= BOUNDS_PAD_DEG;
  maxLng += BOUNDS_PAD_DEG;

  return TRADE_AREA_LANDMARKS.filter(
    (landmark) =>
      landmark.position.lat >= minLat &&
      landmark.position.lat <= maxLat &&
      landmark.position.lng >= minLng &&
      landmark.position.lng <= maxLng
  );
}
