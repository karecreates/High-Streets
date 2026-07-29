import { useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";

/** Toggles native Google Maps chrome for static / interactive modes. */
export function MapChromeVisibility({ visible }: { visible: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.setOptions({
      zoomControl: visible,
      fullscreenControl: false,
      streetViewControl: false,
      mapTypeControl: false,
      scaleControl: false,
      rotateControl: false,
      keyboardShortcuts: visible,
      disableDefaultUI: !visible,
    });
  }, [map, visible]);

  return null;
}
