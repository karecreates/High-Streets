import { useCallback } from "react";
import { MAP_Z_INDEX } from "../config/mapZIndex";
import type { ShoppingCenter } from "../data/shoppingCenters";
import type { OverviewMarkerLayout } from "../utils/overviewMarkerLayout";
import { ShoppingCenterPin } from "./ShoppingCenterPin";

interface ShoppingCenterPinsLayerProps {
  centers: ShoppingCenter[];
  onSelect: (center: ShoppingCenter) => void;
  /** Collision-resolved placement / offset (same as dashboard overview). */
  layouts?: Record<string, OverviewMarkerLayout>;
  /** When false, pins stay visible but are not clickable. */
  interactive?: boolean;
}

function ShoppingCenterPinItem({
  center,
  onSelect,
  layout,
  interactive,
}: {
  center: ShoppingCenter;
  onSelect: (center: ShoppingCenter) => void;
  layout?: OverviewMarkerLayout;
  interactive: boolean;
}) {
  const handleClick = useCallback(() => {
    if (center.mapPinOnly) return;
    onSelect(center);
  }, [center, onSelect]);

  return (
    <ShoppingCenterPin
      center={center}
      onClick={handleClick}
      compact
      layout={layout}
      interactive={interactive}
      zIndex={MAP_Z_INDEX.vacancyMarker + 10}
    />
  );
}

/** Compact logo pins for every wired shopping center on the master map. */
export function ShoppingCenterPinsLayer({
  centers,
  onSelect,
  layouts = {},
  interactive = true,
}: ShoppingCenterPinsLayerProps) {
  return (
    <>
      {centers.map((center) => (
        <ShoppingCenterPinItem
          key={center.slug}
          center={center}
          onSelect={onSelect}
          layout={layouts[`center:${center.slug}`]}
          interactive={interactive}
        />
      ))}
    </>
  );
}
