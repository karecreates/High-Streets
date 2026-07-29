import { useMap } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";

/** Current map zoom, or null before the map is ready. */
export function useMapZoom(): number | null {
  const map = useMap();
  const [zoom, setZoom] = useState<number | null>(() => map?.getZoom() ?? null);

  useEffect(() => {
    if (!map) return;

    const sync = () => setZoom(map.getZoom() ?? null);
    sync();
    const listener = map.addListener("zoom_changed", sync);
    return () => listener.remove();
  }, [map]);

  return zoom;
}
