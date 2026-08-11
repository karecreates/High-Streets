import { HIGH_STREET_CORRIDORS } from "../data/highStreets";
import {
  getMapContextLandmarks,
  getShoppingCenter,
  type ShoppingCenter,
} from "../data/shoppingCenters";
import {
  getActiveDashboardMapLocations,
  type DashboardMapLocation,
} from "./dashboardMapLocations";
import {
  isWithinMeters,
  NEARBY_CENTER_RADIUS_M,
  NEARBY_CALLOUT_RADIUS_M,
  NEARBY_LANDMARK_RADIUS_M,
  type LatLngLike,
} from "./geoProximity";

/** Active shopping-center logo pins for master + dedicated maps. */
export function getActiveShoppingCenters(): ShoppingCenter[] {
  const wired = HIGH_STREET_CORRIDORS.filter(
    (corridor) => corridor.category === "shopping-centers" && corridor.active
  )
    .map((corridor) => getShoppingCenter(corridor.slug))
    .filter((center): center is ShoppingCenter => Boolean(center));

  return [...wired, ...getMapContextLandmarks()];
}

/** Shopping centers near a dedicated-map focus point. */
export function getNearbyShoppingCenters(
  center: LatLngLike,
  options?: { radiusMeters?: number; alwaysIncludeSlug?: string }
): ShoppingCenter[] {
  const radius = options?.radiusMeters ?? NEARBY_CENTER_RADIUS_M;
  const landmarkRadius = NEARBY_LANDMARK_RADIUS_M;
  const alwaysSlug = options?.alwaysIncludeSlug;

  return getActiveShoppingCenters().filter((item) => {
    if (alwaysSlug && item.slug === alwaysSlug) return true;
    const maxDistance = item.mapPinOnly ? landmarkRadius : radius;
    return isWithinMeters(center, item.mapCenter, maxDistance);
  });
}

/**
 * High-street callouts for context on dedicated maps.
 * Optionally exclude the corridor you're already viewing.
 */
export function getStreetAndDistrictCallouts(
  excludeSlug?: string
): DashboardMapLocation[] {
  return getActiveDashboardMapLocations().filter(
    (location) =>
      location.category === "high-streets" && location.slug !== excludeSlug
  );
}

/** Nearby high-street callouts around a dedicated-map focus point. */
export function getNearbyStreetCallouts(
  center: LatLngLike,
  excludeSlug?: string,
  options?: { radiusMeters?: number }
): DashboardMapLocation[] {
  const radius = options?.radiusMeters ?? NEARBY_CALLOUT_RADIUS_M;
  return getStreetAndDistrictCallouts(excludeSlug).filter((location) =>
    isWithinMeters(center, location.position, radius)
  );
}
