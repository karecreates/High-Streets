import { useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";

export interface MapFocusTarget {
  center: google.maps.LatLngLiteral;
  zoom: number;
  /** Bump to re-trigger pan/zoom when focusing the same coordinates again. */
  nonce?: number;
}

export function MapFocus({ focus }: { focus?: MapFocusTarget | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !focus) return;
    map.panTo(focus.center);
    map.setZoom(focus.zoom);
  }, [map, focus?.center.lat, focus?.center.lng, focus?.zoom, focus?.nonce]);

  return null;
}
