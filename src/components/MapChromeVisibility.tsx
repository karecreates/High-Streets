import { useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";

/** Toggles native Google Maps chrome for static / interactive modes. */
export function MapChromeVisibility({ visible }: { visible: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    // Avoid disableDefaultUI — it can wipe custom Marker overlays when
    // entering static/fullscreen mode (major-tenant logos disappeared).
    map.setOptions({
      zoomControl: visible,
      // Keep native fullscreen off — custom Street View pegman docks beside zoom.
      fullscreenControl: false,
      streetViewControl: false,
      mapTypeControl: false,
      scaleControl: false,
      rotateControl: false,
      keyboardShortcuts: visible,
    });
  }, [map, visible]);

  return null;
}
