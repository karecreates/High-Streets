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
    const apply = () => {
      map.panTo(focus.center);
      map.setZoom(focus.zoom);
      map.setTilt(0);
      map.setHeading(0);
    };
    apply();
    const started = Date.now();
    const listener = map.addListener("idle", () => {
      const fractional = Boolean(map.get("isFractionalZoomEnabled"));
      if (!fractional) {
        if (Date.now() - started > 4000) listener.remove();
        return;
      }
      const zoom = map.getZoom();
      if (zoom == null || Math.abs(zoom - focus.zoom) > 0.05) {
        map.setZoom(focus.zoom);
      }
      listener.remove();
    });
    const timer = window.setTimeout(() => {
      if (!map.get("isFractionalZoomEnabled")) return;
      const zoom = map.getZoom();
      if (zoom == null || Math.abs(zoom - focus.zoom) > 0.05) {
        map.setZoom(focus.zoom);
      }
    }, 700);
    return () => {
      listener.remove();
      window.clearTimeout(timer);
    };
  }, [map, focus?.center.lat, focus?.center.lng, focus?.zoom, focus?.nonce]);

  return null;
}
