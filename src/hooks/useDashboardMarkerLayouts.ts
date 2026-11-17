import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useMemo, useState } from "react";
import type { ShoppingCenter } from "../data/shoppingCenters";
import {
  buildDashboardLayoutItems,
  resolveDashboardMarkerLayouts,
  type DashboardMarkerLayout,
} from "../utils/dashboardMarkerLayout";
import type { DashboardMapLocation } from "../utils/dashboardMapLocations";

/**
 * Resolve orthogonal tails once the camera has settled.
 * Does not recompute on zoom — labels stay fixed to their assigned side.
 */
export function useDashboardMarkerLayouts(
  corridors: DashboardMapLocation[],
  centers: ShoppingCenter[],
  ready: boolean
) {
  const map = useMap();
  const [layouts, setLayouts] = useState<Record<
    string,
    DashboardMarkerLayout
  > | null>(null);

  const items = useMemo(
    () => buildDashboardLayoutItems(corridors, centers),
    [corridors, centers]
  );

  useEffect(() => {
    if (!map || !ready) return;
    setLayouts(resolveDashboardMarkerLayouts(map, items));
  }, [map, ready, items]);

  return layouts;
}
