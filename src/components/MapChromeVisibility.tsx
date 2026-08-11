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
      fullscreenControl: false,
      streetViewControl: false,
      mapTypeControl: false,
      scaleControl: false,
      rotateControl: false,
      keyboardShortcuts: visible,
      clickableIcons: visible,
    });

    // Extra pass: some Google control nodes linger in the DOM after options change.
    if (!visible) {
      const root = map.getDiv();
      root
        .querySelectorAll(
          ".gm-bundled-control, .gmnoprint, .gm-svpc, .gm-fullscreen-control, button.gm-control-active"
        )
        .forEach((node) => {
          if (node instanceof HTMLElement) {
            node.style.setProperty("display", "none", "important");
            node.style.setProperty("visibility", "hidden", "important");
            node.style.setProperty("opacity", "0", "important");
          }
        });
    }
  }, [map, visible]);

  return null;
}
