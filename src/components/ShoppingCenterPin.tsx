import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef } from "react";
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
  const markerRef = useRef<google.maps.Marker | null>(null);
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;
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
      clickable: !center.mapPinOnly,
    });
    markerRef.current = marker;

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

    const listener = center.mapPinOnly
      ? null
      : marker.addListener("click", () => onClickRef.current());

    return () => {
      cancelled = true;
      listener?.remove();
      marker.setMap(null);
      markerRef.current = null;
    };
  }, [map, center, zIndex, compact, placement, offsetX]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    marker.setClickable(interactive && !center.mapPinOnly);
  }, [center.mapPinOnly, interactive]);

  return null;
}
