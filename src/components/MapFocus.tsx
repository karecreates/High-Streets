import { useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";

export interface MapFocusTarget {
  center: google.maps.LatLngLiteral;
  zoom: number;
}

export function MapFocus({ focus }: { focus?: MapFocusTarget | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !focus) return;
    map.panTo(focus.center);
    map.setZoom(focus.zoom);
  }, [map, focus?.center.lat, focus?.center.lng, focus?.zoom]);

  return null;
}
