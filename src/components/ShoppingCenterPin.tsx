import { useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";
import { MAP_Z_INDEX } from "../config/mapZIndex";
import type { ShoppingCenter } from "../data/shoppingCenters";
import { createShoppingCenterMarkerIcon } from "../utils/createShoppingCenterMarkerIcon";
import type { OverviewMarkerLayout } from "../utils/overviewMarkerLayout";

interface ShoppingCenterPinProps {
  center: ShoppingCenter;
  onClick: () => void;
  /** Keep logo pins above clustered street tenants on the master map. */
  zIndex?: number;
  /** Smaller logo callout for overview maps. */
  compact?: boolean;
  /** Collision-resolved placement / offset (same as dashboard overview). */
  layout?: OverviewMarkerLayout;
  /** When false, pin is display-only (e.g. static screenshot mode). */
  interactive?: boolean;
}

export function ShoppingCenterPin({
  center,
  onClick,
  zIndex = MAP_Z_INDEX.tenantMarker,
  compact = false,
  layout,
  interactive = true,
}: ShoppingCenterPinProps) {
  const map = useMap();
  const placement =
    layout?.placement ??
    (compact ? center.masterMapLogoPlacement : undefined) ??
    "above";
  const offsetX = layout?.offsetX ?? 0;

  useEffect(() => {
    if (!map) return;

    const marker = new google.maps.Marker({
      position: center.mapCenter,
      map,
      title: center.name,
      optimized: false,
      zIndex,
      clickable: interactive && !center.mapPinOnly,
    });

    let cancelled = false;
    createShoppingCenterMarkerIcon(center.logo, {
      lightBox: center.lightLogoMarker,
      boxBg: center.logoMarkerBg,
      compact,
      placement,
      offsetX,
      showStem: false,
      logoWidth: compact ? center.masterMapLogoWidth : undefined,
      logoCrop: center.logoCrop,
    }).then((icon) => {
      if (!cancelled) marker.setIcon(icon);
    });

    const listener =
      interactive && !center.mapPinOnly
        ? marker.addListener("click", onClick)
        : null;

    return () => {
      cancelled = true;
      listener?.remove();
      marker.setMap(null);
    };
  }, [
    map,
    center,
    onClick,
    zIndex,
    compact,
    placement,
    offsetX,
    interactive,
  ]);

  return null;
}
