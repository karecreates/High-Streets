import { Map } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useState } from "react";
import type { ShoppingCenter } from "../data/shoppingCenters";
import { getMasterMapId } from "../utils/mapConfig";
import { MapChromeVisibility } from "./MapChromeVisibility";
import { ShoppingCenterDirectoryModal } from "./ShoppingCenterDirectoryModal";
import { ShoppingCenterPin } from "./ShoppingCenterPin";
import { MapTypeToggle } from "./MapTypeToggle";
import { StreetViewControl } from "./StreetViewControl";

interface ShoppingCenterMapViewProps {
  center: ShoppingCenter;
  staticMode?: boolean;
}

export function ShoppingCenterMapView({
  center,
  staticMode = false,
}: ShoppingCenterMapViewProps) {
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const mapId = getMasterMapId();
  const openDirectory = useCallback(() => {
    if (staticMode) return;
    setDirectoryOpen(true);
  }, [staticMode]);
  const closeDirectory = useCallback(() => setDirectoryOpen(false), []);

  useEffect(() => {
    if (staticMode) setDirectoryOpen(false);
  }, [staticMode]);

  return (
    <div
      className={`map-shell map-shell--embedded${
        staticMode ? " map-shell--static" : ""
      }`}
    >
      <Map
        className="map-canvas"
        defaultCenter={center.mapCenter}
        defaultZoom={center.mapZoom}
        mapId={mapId}
        gestureHandling="greedy"
        zoomControl={!staticMode}
        fullscreenControl={!staticMode}
        mapTypeControl={false}
        streetViewControl={false}
      >
        <MapChromeVisibility visible={!staticMode} />
        <ShoppingCenterPin center={center} onClick={openDirectory} />
        {!staticMode ? <MapTypeToggle /> : null}
        {!staticMode ? <StreetViewControl /> : null}
      </Map>

      {directoryOpen && !staticMode ? (
        <ShoppingCenterDirectoryModal center={center} onClose={closeDirectory} />
      ) : null}
    </div>
  );
}
