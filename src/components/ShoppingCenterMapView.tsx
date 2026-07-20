import { Map } from "@vis.gl/react-google-maps";
import { useCallback, useState } from "react";
import type { ShoppingCenter } from "../data/shoppingCenters";
import { getMapId } from "../utils/mapConfig";
import { MAP_STYLES_WITH_STREET_LABELS } from "../utils/mapStyles";
import { ShoppingCenterDirectoryModal } from "./ShoppingCenterDirectoryModal";
import { ShoppingCenterPin } from "./ShoppingCenterPin";
import { MapTypeToggle } from "./MapTypeToggle";
import { StreetViewControl } from "./StreetViewControl";

interface ShoppingCenterMapViewProps {
  center: ShoppingCenter;
}

export function ShoppingCenterMapView({ center }: ShoppingCenterMapViewProps) {
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const mapId = getMapId();
  const openDirectory = useCallback(() => setDirectoryOpen(true), []);
  const closeDirectory = useCallback(() => setDirectoryOpen(false), []);

  return (
    <div className="map-shell map-shell--embedded">
      <Map
        className="map-canvas"
        defaultCenter={center.mapCenter}
        defaultZoom={center.mapZoom}
        {...(mapId ? { mapId } : {})}
        gestureHandling="greedy"
        fullscreenControl
        mapTypeControl={false}
        streetViewControl={false}
        styles={MAP_STYLES_WITH_STREET_LABELS}
      >
        <ShoppingCenterPin center={center} onOpenDirectory={openDirectory} />
        <MapTypeToggle />
        <StreetViewControl />
      </Map>

      {directoryOpen ? (
        <ShoppingCenterDirectoryModal center={center} onClose={closeDirectory} />
      ) : null}
    </div>
  );
}
