import { useCallback } from "react";
import { MAP_Z_INDEX } from "../config/mapZIndex";
import type { ShoppingCenter } from "../data/shoppingCenters";
import { ShoppingCenterPin } from "./ShoppingCenterPin";

interface ShoppingCenterPinsLayerProps {
  centers: ShoppingCenter[];
  onSelect: (center: ShoppingCenter) => void;
}

function ShoppingCenterPinItem({
  center,
  onSelect,
}: {
  center: ShoppingCenter;
  onSelect: (center: ShoppingCenter) => void;
}) {
  const handleClick = useCallback(() => onSelect(center), [center, onSelect]);

  return (
    <ShoppingCenterPin
      center={center}
      onClick={handleClick}
      compact
      zIndex={MAP_Z_INDEX.vacancyMarker + 10}
    />
  );
}

/** Compact logo pins for every wired shopping center on the master map. */
export function ShoppingCenterPinsLayer({
  centers,
  onSelect,
}: ShoppingCenterPinsLayerProps) {
  return (
    <>
      {centers.map((center) => (
        <ShoppingCenterPinItem
          key={center.slug}
          center={center}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}
