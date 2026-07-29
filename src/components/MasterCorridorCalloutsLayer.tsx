import { useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";
import { MAP_Z_INDEX } from "../config/mapZIndex";
import { createCalloutIcon } from "../utils/createCalloutIcon";
import type { DashboardMapLocation } from "../utils/dashboardMapLocations";

interface MasterCorridorCalloutsLayerProps {
  locations: DashboardMapLocation[];
  onSelect: (slug: string) => void;
}

/** Compact corridor pills for high streets + districts on the zoomed-out master map. */
export function MasterCorridorCalloutsLayer({
  locations,
  onSelect,
}: MasterCorridorCalloutsLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || locations.length === 0) return;

    const markers: google.maps.Marker[] = [];
    const listeners: google.maps.MapsEventListener[] = [];

    for (const location of locations) {
      const marker = new google.maps.Marker({
        position: location.position,
        map,
        icon: createCalloutIcon(location.label, {
          size: "compact",
          showStem: false,
          showAnchorDot: true,
          placement: location.labelPlacement ?? "above",
        }),
        optimized: false,
        zIndex: MAP_Z_INDEX.tenantMarker + 50,
        title: location.name,
        clickable: true,
      });

      listeners.push(
        marker.addListener("click", () => {
          onSelect(location.slug);
        })
      );
      markers.push(marker);
    }

    return () => {
      for (const listener of listeners) listener.remove();
      for (const marker of markers) marker.setMap(null);
    };
  }, [map, locations, onSelect]);

  return null;
}
