import { useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";
import { MAP_Z_INDEX } from "../config/mapZIndex";
import { createCalloutIcon } from "../utils/createCalloutIcon";
import type { DashboardMapLocation } from "../utils/dashboardMapLocations";
import type { OverviewMarkerLayout } from "../utils/overviewMarkerLayout";

interface MasterCorridorCalloutsLayerProps {
  locations: DashboardMapLocation[];
  onSelect: (slug: string) => void;
  /** Collision-resolved placement / offset (same as dashboard overview). */
  layouts?: Record<string, OverviewMarkerLayout>;
}

/** Compact corridor pills for high streets + districts on the zoomed-out master map. */
export function MasterCorridorCalloutsLayer({
  locations,
  onSelect,
  layouts = {},
}: MasterCorridorCalloutsLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || locations.length === 0) return;

    const markers: google.maps.Marker[] = [];
    const listeners: google.maps.MapsEventListener[] = [];

    for (const location of locations) {
      const layout = layouts[`corridor:${location.slug}`] ?? {
        placement: location.labelPlacement ?? "above",
        offsetX: 0,
      };
      const marker = new google.maps.Marker({
        position: location.position,
        map,
        icon: createCalloutIcon(location.label, {
          size: "compact",
          showStem: false,
          showAnchorDot: true,
          placement: layout.placement,
          offsetX: layout.offsetX,
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
  }, [map, locations, onSelect, layouts]);

  return null;
}
