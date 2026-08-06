import { HIGH_STREET_CORRIDORS } from "../data/highStreets";
import {
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
  type LatLngLike,
} from "./geoProximity";

/** Active shopping-center logo pins for master + dedicated maps. */
export function getActiveShoppingCenters(): ShoppingCenter[] {
  return HIGH_STREET_CORRIDORS.filter(
    (corridor) => corridor.category === "shopping-centers" && corridor.active
  )
    .map((corridor) => getShoppingCenter(corridor.slug))
    .filter((center): center is ShoppingCenter => Boolean(center));
}

/** Shopping centers near a dedicated-map focus point. */
export function getNearbyShoppingCenters(
  center: LatLngLike,
  options?: { radiusMeters?: number; alwaysIncludeSlug?: string }
): ShoppingCenter[] {
  const radius = options?.radiusMeters ?? NEARBY_CENTER_RADIUS_M;
  const alwaysSlug = options?.alwaysIncludeSlug;

  return getActiveShoppingCenters().filter((item) => {
    if (alwaysSlug && item.slug === alwaysSlug) return true;
    return isWithinMeters(center, item.mapCenter, radius);
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
