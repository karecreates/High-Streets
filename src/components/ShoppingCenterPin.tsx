import { useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";
import { MAP_Z_INDEX } from "../config/mapZIndex";
import type { ShoppingCenter } from "../data/shoppingCenters";
import { createShoppingCenterMarkerIcon } from "../utils/createShoppingCenterMarkerIcon";

interface ShoppingCenterPinProps {
  center: ShoppingCenter;
  onClick: () => void;
  /** Keep logo pins above clustered street tenants on the master map. */
  zIndex?: number;
  /** Smaller logo callout for overview maps. */
  compact?: boolean;
}

export function ShoppingCenterPin({
  center,
  onClick,
  zIndex = MAP_Z_INDEX.tenantMarker,
  compact = false,
}: ShoppingCenterPinProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const marker = new google.maps.Marker({
      position: center.mapCenter,
      map,
      title: center.name,
      optimized: false,
      zIndex,
    });

    let cancelled = false;
    createShoppingCenterMarkerIcon(center.logo, {
      lightBox: center.lightLogoMarker,
      boxBg: center.logoMarkerBg,
      compact,
      placement: compact ? center.masterMapLogoPlacement : undefined,
      logoWidth: compact ? center.masterMapLogoWidth : undefined,
      logoCrop: center.logoCrop,
    }).then((icon) => {
      if (!cancelled) marker.setIcon(icon);
    });

    const listener = marker.addListener("click", onClick);

    return () => {
      cancelled = true;
      listener.remove();
      marker.setMap(null);
    };
  }, [map, center, onClick, zIndex, compact]);

  return null;
}
