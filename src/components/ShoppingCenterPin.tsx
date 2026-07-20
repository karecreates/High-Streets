import { useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";
import { MAP_Z_INDEX } from "../config/mapZIndex";
import type { ShoppingCenter } from "../data/shoppingCenters";
import { createShoppingCenterMarkerIcon } from "../utils/createShoppingCenterMarkerIcon";

interface ShoppingCenterPinProps {
  center: ShoppingCenter;
  onOpenDirectory: () => void;
}

export function ShoppingCenterPin({
  center,
  onOpenDirectory,
}: ShoppingCenterPinProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const marker = new google.maps.Marker({
      position: center.mapCenter,
      map,
      title: center.name,
      optimized: false,
      zIndex: MAP_Z_INDEX.tenantMarker,
    });

    let cancelled = false;
    createShoppingCenterMarkerIcon(center.logo).then((icon) => {
      if (!cancelled) marker.setIcon(icon);
    });

    const listener = marker.addListener("click", onOpenDirectory);

    return () => {
      cancelled = true;
      listener.remove();
      marker.setMap(null);
    };
  }, [map, center, onOpenDirectory]);

  return null;
}
