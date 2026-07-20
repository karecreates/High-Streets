import { useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";

/** Adds a styled Map/Satellite toggle into the map's native control stack. */
export function MapTypeToggle() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "map-type-toggle";
    let satellite = false;

    const render = () => {
      button.textContent = satellite ? "Map" : "Satellite";
      button.setAttribute("aria-pressed", String(satellite));
    };
    render();

    button.addEventListener("click", () => {
      satellite = !satellite;
      map.setMapTypeId(satellite ? "hybrid" : "roadmap");
      render();
    });

    const position = google.maps.ControlPosition.TOP_RIGHT;
    map.controls[position].push(button);

    return () => {
      const controls = map.controls[position];
      for (let i = 0; i < controls.getLength(); i++) {
        if (controls.getAt(i) === button) {
          controls.removeAt(i);
          break;
        }
      }
    };
  }, [map]);

  return null;
}
