export interface LatLngLike {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_M = 6_371_000;

/** Great-circle distance in meters. */
export function distanceMeters(a: LatLngLike, b: LatLngLike): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isWithinMeters(
  a: LatLngLike,
  b: LatLngLike,
  maxMeters: number
): boolean {
  return distanceMeters(a, b) <= maxMeters;
}

/**
 * Nearby context on dedicated maps — wide enough for Downtown LA ↔ Arts District
 * (~2.7 km center-to-center) without loading every LA corridor.
 */
export const NEARBY_TENANT_RADIUS_M = 3_500; // ~2.2 mi
export const NEARBY_CENTER_RADIUS_M = 2_000; // ~1.25 mi
/** Wider radius so DTLA landmarks (FIGat7th, L.A. Live) reach Arts District maps. */
export const NEARBY_LANDMARK_RADIUS_M = 4_000; // ~2.5 mi
/** Nearby high-street callouts on dedicated maps (same band as tenants). */
export const NEARBY_CALLOUT_RADIUS_M = 3_500; // ~2.2 mi

export function filterByProximity<
  T extends { lat: number | null; lng: number | null },
>(items: T[], center: LatLngLike, maxMeters: number): T[] {
  return items.filter(
    (item) =>
      item.lat != null &&
      item.lng != null &&
      isWithinMeters(
        center,
        { lat: item.lat, lng: item.lng },
        maxMeters
      )
  );
}
