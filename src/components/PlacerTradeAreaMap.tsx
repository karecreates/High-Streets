import { useEffect, useMemo, useRef } from "react";
import { Map, useMap } from "@vis.gl/react-google-maps";
import { MAP_Z_INDEX } from "../config/mapZIndex";
import { getLandmarksForTradeArea } from "../data/placer/tradeAreaLandmarks";
import type { PlacerPolygon } from "../data/placer/types";
import { createCalloutIcon } from "../utils/createCalloutIcon";
import { getMasterMapId } from "../utils/mapConfig";
import { StreetViewControl } from "./StreetViewControl";

const FILL_COLOR = "#2f6f75";
const STROKE_COLOR = "#1f4d52";

interface TradeAreaOverlayProps {
  polygons: PlacerPolygon[];
  site: { lat: number; lng: number };
  /** Extra padding (px) when fitting the trade area into view. */
  fitPadding?: number;
  /** Zoom delta after fitBounds (positive = closer, negative = further out). */
  zoomInSteps?: number;
  /** Orientation landmarks — keep off on the compact inline map. */
  showLandmarks?: boolean;
}

/** Draws trade-area polygons, site pin, and optional orientation landmarks. */
function TradeAreaOverlay({
  polygons,
  site,
  fitPadding = 24,
  zoomInSteps = 0,
  showLandmarks = false,
}: TradeAreaOverlayProps) {
  const map = useMap();
  const drawnRef = useRef<google.maps.Polygon[]>([]);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const landmarkMarkersRef = useRef<google.maps.Marker[]>([]);

  const landmarks = useMemo(
    () => (showLandmarks ? getLandmarksForTradeArea(polygons) : []),
    [polygons, showLandmarks]
  );

  useEffect(() => {
    if (!map) return;

    const shapes = polygons.map(
      (polygon) =>
        new google.maps.Polygon({
          map,
          paths: [polygon.outer, ...polygon.inners],
          fillColor: FILL_COLOR,
          fillOpacity: 0.22,
          strokeColor: STROKE_COLOR,
          strokeOpacity: 0.85,
          strokeWeight: 2,
          clickable: false,
        })
    );
    drawnRef.current = shapes;

    const marker = new google.maps.Marker({
      map,
      position: site,
      title: "Trade area site",
      zIndex: MAP_Z_INDEX.tenantMarker + 100,
    });
    markerRef.current = marker;

    const landmarkMarkers = landmarks.map(
      (landmark) =>
        new google.maps.Marker({
          map,
          position: landmark.position,
          title: landmark.name,
          clickable: false,
          optimized: false,
          zIndex: MAP_Z_INDEX.districtLabel,
          icon: createCalloutIcon(landmark.name, {
            size: "compact",
            variant: "inverse",
            showStem: false,
            showAnchorDot: true,
            placement: landmark.placement ?? "above",
          }),
        })
    );
    landmarkMarkersRef.current = landmarkMarkers;

    const bounds = new google.maps.LatLngBounds();
    for (const polygon of polygons) {
      for (const point of polygon.outer) bounds.extend(point);
    }
    map.fitBounds(bounds, fitPadding);

    let idleListener: google.maps.MapsEventListener | null = null;
    if (zoomInSteps !== 0) {
      idleListener = google.maps.event.addListenerOnce(map, "idle", () => {
        const current = map.getZoom();
        if (current == null) return;
        map.setZoom(current + zoomInSteps);
      });
    }

    return () => {
      if (idleListener) google.maps.event.removeListener(idleListener);
      shapes.forEach((shape) => shape.setMap(null));
      marker.setMap(null);
      landmarkMarkers.forEach((m) => m.setMap(null));
      drawnRef.current = [];
      markerRef.current = null;
      landmarkMarkersRef.current = [];
    };
  }, [map, polygons, site, fitPadding, zoomInSteps, landmarks]);

  return null;
}

interface PlacerTradeAreaMapProps {
  polygons: PlacerPolygon[];
  site: { lat: number; lng: number };
  /** Distinct map instance id — required when two maps mount at once. */
  mapKey: string;
  fitPadding?: number;
  /** Zoom delta after fitBounds (positive = closer, negative = further out). */
  zoomInSteps?: number;
  /** Show orientation landmarks (expanded modal only). */
  showLandmarks?: boolean;
}

export function PlacerTradeAreaMap({
  polygons,
  site,
  mapKey,
  fitPadding,
  zoomInSteps = 1,
  showLandmarks = false,
}: PlacerTradeAreaMapProps) {
  const mapId = useMemo(() => getMasterMapId(), []);

  return (
    <div className="placer-trade-map-shell map-shell">
      <Map
        id={mapKey}
        mapId={mapId}
        defaultCenter={site}
        defaultZoom={11}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        zoomControl
        clickableIcons={false}
        style={{ width: "100%", height: "100%" }}
      >
        <TradeAreaOverlay
          polygons={polygons}
          site={site}
          fitPadding={fitPadding}
          zoomInSteps={zoomInSteps}
          showLandmarks={showLandmarks}
        />
        <StreetViewControl />
      </Map>
    </div>
  );
}
