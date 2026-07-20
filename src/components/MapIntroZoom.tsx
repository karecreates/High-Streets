import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";

export interface MapIntroTarget {
  center: google.maps.LatLngLiteral;
  zoom: number;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function MapIntroZoom({
  target,
  onComplete,
}: {
  target: MapIntroTarget;
  onComplete?: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    map.setCenter({ lat: 10, lng: -130 });
    map.setZoom(3);

    const startCenter = map.getCenter();
    const startZoom = map.getZoom() ?? 3;
    if (!startCenter) return;

    const startLat = startCenter.lat();
    const startLng = startCenter.lng();
    const duration = 2600;
    const startTime = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = easeOutCubic(progress);
      const lat = startLat + (target.center.lat - startLat) * eased;
      const lng = startLng + (target.center.lng - startLng) * eased;
      const zoom = startZoom + (target.zoom - startZoom) * eased;
      map.moveCamera({ center: { lat, lng }, zoom });

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        onComplete?.();
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [map, target.center.lat, target.center.lng, target.zoom, onComplete]);

  return null;
}
