import { useMap } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ShoppingCenter } from "../data/shoppingCenters";
import type { DashboardMapLocation } from "../utils/dashboardMapLocations";
import {
  buildOverviewLayoutItems,
  resolveOverviewMarkerLayouts,
  type OverviewMarkerLayout,
} from "../utils/overviewMarkerLayout";

/**
 * Resolve non-overlapping above/below + offsetX layouts for corridor pills
 * and shopping-center logos. Anchors stay on true lat/lng.
 */
export function useOverviewMarkerLayouts(
  corridors: DashboardMapLocation[],
  centers: ShoppingCenter[],
  options?: { /** Wait for an external fitBounds before first resolve (dashboard). */ deferUntilReady?: boolean }
) {
  const map = useMap();
  const [layouts, setLayouts] = useState<Record<string, OverviewMarkerLayout>>(
    {}
  );
  const [ready, setReady] = useState(!options?.deferUntilReady);

  const items = useMemo(
    () => buildOverviewLayoutItems(corridors, centers),
    [corridors, centers]
  );

  const recompute = useCallback(() => {
    if (!map) return;
    setLayouts(resolveOverviewMarkerLayouts(map, items));
  }, [map, items]);

  const markFitted = useCallback(() => setReady(true), []);

  useEffect(() => {
    if (!map || !ready) return;
    recompute();
    const idleListener = map.addListener("idle", recompute);
    const zoomListener = map.addListener("zoom_changed", recompute);
    return () => {
      idleListener.remove();
      zoomListener.remove();
    };
  }, [map, ready, recompute]);

  return { layouts, markFitted };
}
